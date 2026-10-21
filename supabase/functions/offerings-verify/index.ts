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

  const { reference } = await req.json();

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}` },
  });

  const paystackData = await paystackRes.json();

  if (paystackData.data.status === 'success') {
    await supabase.from('offerings').update({ status: 'successful' }).eq('reference', reference);
    return new Response(JSON.stringify({ status: 'successful' }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ status: paystackData.data.status }), { headers: corsHeaders });
});