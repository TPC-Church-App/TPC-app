// ===============================================================
// supabase/functions/paystack-return/index.ts
// Return Paystack's HTTPS redirect to the TPC app without trusting status.
// ===============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { buildPaystackAppReturnUrl } from '../_shared/paystack-return.ts';

// ===============================================================
// PROVIDER CALLBACK REDIRECT
// This route exposes no payment result; the app must verify the reference.
// ===============================================================

export function handlePaystackReturn(req: Request): Response {
  if (req.method !== 'GET') {
    return new Response('Use GET for this callback.', {
      status: 405,
      headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
    });
  }

  const callbackParameters = new URL(req.url).searchParams;
  return new Response(null, {
    status: 302,
    headers: {
      Location: buildPaystackAppReturnUrl(callbackParameters),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

// ===============================================================
// EDGE FUNCTION ENTRY POINT
// ===============================================================

serve(handlePaystackReturn);
