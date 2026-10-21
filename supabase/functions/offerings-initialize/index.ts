import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const { amount, fund_id } = await req.json();
  if (!amount || amount < 100) return new Response('Invalid amount', { status: 400, headers: corsHeaders });

  const reference = `TPC_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create pending offering
  const { error } = await supabase.from('offerings').insert({
    user_id: user.id,
    amount,
    fund_id,
    reference,
    status: 'pending',
  });

  if (error) return new Response(JSON.stringify(error), { status: 500, headers: corsHeaders });

  // Initialize Paystack
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amount * 100, // Paystack expects kobo
      reference,
      callback_url: `${Deno.env.get('APP_URL')}/payment/callback`,
    }),
  });

  const paystackData = await paystackRes.json();
  return new Response(JSON.stringify(paystackData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});