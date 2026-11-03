// supabase/functions/attendance-check-in/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { qr_code } = await req.json();
    if (!qr_code) throw new Error('QR code is required');

    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('id, title, is_active')
      .eq('qr_code', qr_code)
      .single();

    if (serviceError || !service) throw new Error('Invalid QR Code');
    if (!service.is_active) throw new Error('Check-in is not active for this service');

    const { data: existing } = await supabaseClient
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_id', service.id)
      .maybeSingle();

    if (existing) throw new Error('You have already checked in');

    const { error: insertError } = await supabaseClient
      .from('attendance')
      .insert({ user_id: user.id, service_id: service.id, method: 'qr' });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ 
      message: 'Check-in successful',
      service_title: service.title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});