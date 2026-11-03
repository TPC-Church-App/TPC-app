// ===============================================================
// offerings-initialize/index.ts
// Creates an authenticated member's pending offering and requests
// a Paystack checkout without trusting client payment status.
// ===============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { corsHeaders } from '../_shared/cors.ts';
import {
  amountToMinor,
  isRecord,
  jsonResponse,
  PaymentError,
  paymentFailure,
  ProviderError,
  readJson,
  requestPaystack,
  validateEmail,
  validateFundId,
} from '../_shared/payments.ts';

// ===============================================================
// CHECKOUT INITIALIZATION
// ===============================================================

// @desc    Initialize a pending offering using a trusted member identity.
// @route   POST /functions/v1/offerings-initialize
// @access  Authenticated member with a verified email or phone
export async function handleInitialize(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return jsonResponse(
      {
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Use POST for this endpoint.',
        },
      },
      405,
      { ...corsHeaders, Allow: 'POST, OPTIONS' },
    );
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      throw new PaymentError(
        401,
        'UNAUTHORIZED',
        'Sign in to initialize an offering.',
      );
    }

    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!url || !anonKey || !serviceKey || !paystackSecret) {
      throw new PaymentError(
        500,
        'CONFIGURATION_ERROR',
        'Payment initialization is not configured.',
      );
    }

    // Verify the bearer token with Auth instead of trusting a submitted user_id or decoded token.
    const memberClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await memberClient.auth.getUser();
    if (authError || !user)
      throw new PaymentError(
        401,
        'UNAUTHORIZED',
        'Sign in to initialize an offering.',
      );

    if (!user.email_confirmed_at && !user.phone_confirmed_at) {
      throw new PaymentError(
        403,
        'CONTACT_NOT_VERIFIED',
        'Verify your email address or phone number before giving.',
      );
    }

    const body = await readJson(req);
    const amountMinor = amountToMinor(body.amount);
    const fundId = validateFundId(body.fund_id);
    // Phone-only members supply a genuine checkout email; phone authentication remains unchanged.
    const email = validateEmail(user.email || body.email);

    const { data: profile, error: profileError } = await memberClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError)
      throw new PaymentError(
        500,
        'PROFILE_CHECK_FAILED',
        'Your profile could not be checked.',
      );
    if (!profile)
      throw new PaymentError(
        409,
        'PROFILE_INCOMPLETE',
        'Complete your member profile before giving.',
      );

    const { data: fund, error: fundError } = await memberClient
      .from('funds')
      .select('id')
      .eq('id', fundId)
      .eq('is_active', true)
      .maybeSingle();
    if (fundError)
      throw new PaymentError(
        500,
        'FUND_CHECK_FAILED',
        'The giving fund could not be checked.',
      );
    if (!fund)
      throw new PaymentError(
        400,
        'INACTIVE_FUND',
        'Choose an available giving fund.',
      );

    const reference = `TPC-${crypto.randomUUID()}`;
    const serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Member requests cannot set ownership, currency or successful payment status.
    const { data: offering, error: insertError } = await serverClient
      .from('offerings')
      .insert({
        user_id: user.id,
        amount: amountMinor / 100,
        fund_id: fundId,
        reference,
        currency: 'NGN',
        status: 'pending',
      })
      .select('id')
      .single();
    if (insertError || !offering) {
      throw new PaymentError(
        500,
        'OFFERING_CREATE_FAILED',
        'The offering could not be created.',
      );
    }

    let result: Record<string, unknown>;
    try {
      result = await requestPaystack(
        '/transaction/initialize',
        paystackSecret,
        {
          email,
          amount: amountMinor,
          currency: 'NGN',
          reference,
          callback_url: new URL(
            '/functions/v1/paystack-return',
            url,
          ).toString(),
        },
      );
    } catch (error) {
      if (error instanceof ProviderError && error.definitiveFailure) {
        const { error: updateError } = await serverClient
          .from('offerings')
          .update({ status: 'failed' })
          .eq('id', offering.id)
          .eq('status', 'pending');
        if (updateError)
          throw new PaymentError(
            500,
            'INITIALIZATION_RECORD_FAILED',
            'The initialization outcome could not be recorded.',
          );
      }
      // An uncertain timeout leaves the record pending for later reconciliation.
      throw error;
    }

    const data = result.data;
    if (
      !isRecord(data) ||
      data.reference !== reference ||
      typeof data.access_code !== 'string' ||
      !data.access_code ||
      typeof data.authorization_url !== 'string'
    ) {
      throw new ProviderError();
    }
    try {
      if (new URL(data.authorization_url).protocol !== 'https:')
        throw new Error();
    } catch {
      throw new ProviderError();
    }

    // Paystack calls this HTTPS Edge Function, which redirects to a fixed app
    // scheme. The app treats the reference as untrusted until it verifies it.
    return jsonResponse(result, 200, corsHeaders);
  } catch (error) {
    return paymentFailure(error, corsHeaders);
  }
}

// ===============================================================
// EDGE FUNCTION ENTRY POINT
// ===============================================================

serve(handleInitialize);
