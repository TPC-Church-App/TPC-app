// ===============================================================
// offerings-verify/index.ts
// Verifies the caller's own Paystack transaction and records a
// matching payment through the shared atomic settlement operation.
// ===============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  isRecord,
  jsonResponse,
  PaymentError,
  paymentFailure,
  ProviderError,
  readJson,
  requestPaystack,
  settlementArguments,
  settlementError,
  validateReference,
} from '../_shared/payments.ts';

// ===============================================================
// AUTHENTICATED PAYMENT VERIFICATION
// ===============================================================

// @desc    Verify and durably settle the caller's own offering.
// @route   POST /functions/v1/offerings-verify
// @access  Authenticated, verified member
export async function handleVerify(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return jsonResponse(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' } },
      405,
      { ...corsHeaders, Allow: 'POST, OPTIONS' },
    );
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      throw new PaymentError(401, 'UNAUTHORIZED', 'Sign in to verify an offering.');
    }
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!url || !anonKey || !serviceKey || !paystackSecret) {
      throw new PaymentError(500, 'CONFIGURATION_ERROR', 'Payment verification is not configured.');
    }

    const memberClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await memberClient.auth.getUser();
    if (authError || !user)
      throw new PaymentError(401, 'UNAUTHORIZED', 'Sign in to verify an offering.');

    const { data: profile, error: profileError } = await memberClient
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError)
      throw new PaymentError(500, 'PROFILE_CHECK_FAILED', 'Membership could not be checked.');
    if (!profile || profile.is_verified !== true) {
      throw new PaymentError(
        403,
        'MEMBERSHIP_PENDING',
        'Membership verification is required before giving.',
      );
    }

    const body = await readJson(req);
    const reference = validateReference(body.reference);

    // Resolve ownership with the caller's RLS permissions before using service-role privileges.
    const { data: offering, error: offeringError } = await memberClient
      .from('offerings')
      .select('id, reference, amount, currency, status')
      .eq('reference', reference)
      .eq('user_id', user.id)
      .maybeSingle();
    if (offeringError)
      throw new PaymentError(500, 'OFFERING_LOOKUP_FAILED', 'The offering could not be checked.');
    if (!offering) throw new PaymentError(404, 'OFFERING_NOT_FOUND', 'The offering was not found.');

    const result = await requestPaystack(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      paystackSecret,
    );
    const transaction = result.data;
    if (
      !isRecord(transaction) ||
      transaction.reference !== reference ||
      typeof transaction.status !== 'string'
    ) {
      throw new ProviderError();
    }

    if (transaction.status !== 'success') {
      const supportedStatuses = [
        'abandoned',
        'failed',
        'ongoing',
        'pending',
        'processing',
        'queued',
        'reversed',
      ];
      if (!supportedStatuses.includes(transaction.status)) throw new ProviderError();
      return jsonResponse({ status: transaction.status }, 200, corsHeaders);
    }

    const settlementInput = settlementArguments(transaction, reference);
    const serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: settled, error: settlementFailure } = await serverClient.rpc(
      'settle_paystack_payment',
      {
        ...settlementInput,
        p_event_key: null,
      },
    );
    if (settlementFailure) throw settlementError(settlementFailure);
    if (
      !isRecord(settled) ||
      settled.status !== 'successful' ||
      settled.offering_id !== offering.id ||
      typeof settled.payment_id !== 'string' ||
      typeof settled.already_settled !== 'boolean'
    ) {
      throw new PaymentError(
        500,
        'SETTLEMENT_FAILED',
        'The payment could not be confirmed as recorded.',
      );
    }

    return jsonResponse({ status: 'successful' }, 200, corsHeaders);
  } catch (error) {
    return paymentFailure(error, corsHeaders);
  }
}

// ===============================================================
// EDGE FUNCTION ENTRY POINT
// ===============================================================

serve(handleVerify);
