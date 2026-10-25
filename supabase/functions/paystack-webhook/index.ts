// ===============================================================
// paystack-webhook/index.ts
// Authenticates Paystack events using their original body and
// acknowledges success only after atomic payment settlement.
// ===============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  isRecord,
  jsonResponse,
  PaymentError,
  paymentFailure,
  settlementArguments,
  settlementError,
} from '../_shared/payments.ts';

// ===============================================================
// PROVIDER SIGNATURE VERIFICATION
// ===============================================================

export async function verifySignature(
  body: Uint8Array,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!/^[0-9a-f]{128}$/i.test(signature)) return false;
  const signatureBytes = Uint8Array.from(signature.match(/.{2}/g)!, (pair) =>
    Number.parseInt(pair, 16),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['verify'],
  );

  // Web Crypto verifies the signature bytes without a normal string equality comparison.
  return crypto.subtle.verify('HMAC', key, signatureBytes, new Uint8Array(body));
}

// ===============================================================
// SIGNED PAYMENT EVENT HANDLING
// ===============================================================

// @desc    Authenticate and durably settle a successful Paystack charge.
// @route   POST /functions/v1/paystack-webhook
// @access  Paystack HMAC signature; no member JWT
export async function handleWebhook(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' } },
      405,
      { Allow: 'POST' },
    );
  }

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!url || !serviceKey || !secret) {
      throw new PaymentError(500, 'CONFIGURATION_ERROR', 'Payment settlement is not configured.');
    }

    const body = new Uint8Array(await req.arrayBuffer());
    if (body.byteLength > 1_048_576)
      throw new PaymentError(413, 'REQUEST_TOO_LARGE', 'The webhook body is too large.');
    const valid = await verifySignature(
      body,
      req.headers.get('x-paystack-signature') ?? '',
      secret,
    );
    if (!valid)
      throw new PaymentError(401, 'INVALID_SIGNATURE', 'The webhook signature is invalid.');

    let event: unknown;
    try {
      event = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
    } catch {
      throw new PaymentError(400, 'INVALID_JSON', 'The webhook body must contain valid JSON.');
    }
    if (!isRecord(event) || typeof event.event !== 'string' || !event.event) {
      throw new PaymentError(400, 'INVALID_EVENT', 'The webhook event is invalid.');
    }

    // Unimplemented event types are acknowledged but never recorded as completed payment work.
    if (event.event !== 'charge.success') return jsonResponse({ received: true, ignored: true });
    if (!isRecord(event.data) || event.data.status !== 'success') {
      throw new PaymentError(400, 'INVALID_EVENT', 'The successful charge event is invalid.');
    }
    const settlementInput = settlementArguments(event.data);
    const serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The transaction records the offering, payment, audit and event together; retries are safe.
    const { data: settled, error: settlementFailure } = await serverClient.rpc(
      'settle_paystack_payment',
      {
        ...settlementInput,
        p_event_key: `charge.success:${settlementInput.p_provider_transaction_id}`,
      },
    );
    if (settlementFailure) throw settlementError(settlementFailure);
    if (
      !isRecord(settled) ||
      settled.status !== 'successful' ||
      typeof settled.offering_id !== 'string' ||
      typeof settled.payment_id !== 'string' ||
      typeof settled.already_settled !== 'boolean'
    ) {
      throw new PaymentError(
        500,
        'SETTLEMENT_FAILED',
        'The payment could not be confirmed as recorded.',
      );
    }

    // A 5xx failure above allows Paystack to retry instead of losing an unrecorded payment.
    return jsonResponse({ received: true });
  } catch (error) {
    return paymentFailure(error);
  }
}

// ===============================================================
// EDGE FUNCTION ENTRY POINT
// ===============================================================

serve(handleWebhook);
