import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === signature;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('x-paystack-signature') ?? '';
  const body = await req.text();

  const valid = await verifySignature(body, signature, Deno.env.get('PAYSTACK_SECRET_KEY')!);
  if (!valid) return new Response('Invalid signature', { status: 400 });

  // Return 200 immediately, then process
  const response = new Response('ok', { status: 200 });

  const event = JSON.parse(body);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Idempotency check
  const { data: existing } = await supabase.from('webhook_events').select('id').eq('event_id', event.data?.id).maybeSingle();
  if (existing) return response;

  if (event.event === 'charge.success') {
    const { reference, amount, channel, paid_at } = event.data;
    const actualAmount = amount / 100;

    // Update offering
    await supabase.from('offerings').update({ status: 'successful' }).eq('reference', reference);

    // Upsert payment record
    await supabase.from('payments').upsert({
      offering_id: (await supabase.from('offerings').select('id').eq('reference', reference).single()).data?.id,
      reference,
      verified: true,
      channel,
      paid_at,
    }, { onConflict: 'reference' });
  }

  // Record processed event
  await supabase.from('webhook_events').insert({
    event_id: event.data?.id,
    event_type: event.event,
  });

  return response;
});