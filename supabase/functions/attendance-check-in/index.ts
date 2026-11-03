// ===============================================================
// supabase/functions/attendance-check-in/index.ts
// Verify a member and service QR, then record one server-side check-in.
// ===============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { corsHeaders } from '../_shared/cors.ts';
import { isCheckInOpen } from '../_shared/attendance-window.ts';

const MAX_REQUEST_BYTES = 4096;

type JsonRecord = Record<string, unknown>;

function jsonResponse(body: JsonRecord, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function attendanceError(
  status: number,
  code: string,
  message: string,
): Response {
  return jsonResponse({ error: { code, message } }, status);
}

// ===============================================================
// VALIDATE AUTH, SERVICE WINDOW AND QR PAYLOAD
// The member ID always comes from the verified Auth token.
// ===============================================================

async function handleCheckIn(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return attendanceError(405, 'METHOD_NOT_ALLOWED', 'Use POST for check-in.');
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      return attendanceError(401, 'UNAUTHORIZED', 'Sign in to check in.');
    }

    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceKey) {
      return attendanceError(
        500,
        'CONFIGURATION_ERROR',
        'Check-in is not configured.',
      );
    }

    const memberClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await memberClient.auth.getUser();
    if (authError || !user) {
      return attendanceError(401, 'UNAUTHORIZED', 'Sign in to check in.');
    }
    if (!user.email_confirmed_at && !user.phone_confirmed_at) {
      return attendanceError(
        403,
        'CONTACT_NOT_VERIFIED',
        'Verify your email address or phone number before checking in.',
      );
    }

    const { data: profile, error: profileError } = await memberClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      return attendanceError(
        500,
        'PROFILE_CHECK_FAILED',
        'Your profile could not be checked.',
      );
    }
    if (!profile) {
      return attendanceError(
        409,
        'PROFILE_INCOMPLETE',
        'Complete your member profile before checking in.',
      );
    }

    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
      return attendanceError(
        413,
        'REQUEST_TOO_LARGE',
        'The QR request is too large.',
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return attendanceError(
        400,
        'INVALID_JSON',
        'The request must contain valid JSON.',
      );
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return attendanceError(
        400,
        'INVALID_REQUEST',
        'The request must be a JSON object.',
      );
    }

    const qrCode = (body as JsonRecord).qr_code;
    if (
      typeof qrCode !== 'string' ||
      qrCode.trim().length < 1 ||
      qrCode.length > 256
    ) {
      return attendanceError(
        400,
        'INVALID_QR_CODE',
        'Scan a valid service QR code.',
      );
    }

    // ===============================================================
    // USE SERVER PRIVILEGES ONLY AFTER AUTHENTICATING THE MEMBER
    // Direct client attendance inserts remain revoked by database policy.
    // ===============================================================

    const serverClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: service, error: serviceError } = await serverClient
      .from('services')
      .select('id, title, service_date, start_time, end_time, is_active')
      .eq('qr_code', qrCode.trim())
      .maybeSingle();

    if (serviceError) {
      console.error('Attendance service lookup failed', {
        code: serviceError.code ?? 'UNKNOWN',
      });
      return attendanceError(
        500,
        'SERVICE_LOOKUP_FAILED',
        'The service could not be checked.',
      );
    }
    if (!service || service.is_active !== true) {
      return attendanceError(
        404,
        'INVALID_QR_CODE',
        'This service QR code is unavailable.',
      );
    }

    const { data: existing, error: existingError } = await serverClient
      .from('attendance')
      .select('id, checked_in_at')
      .eq('user_id', user.id)
      .eq('service_id', service.id)
      .maybeSingle();
    if (existingError) {
      console.error('Attendance duplicate check failed', {
        code: existingError.code ?? 'UNKNOWN',
      });
      return attendanceError(
        500,
        'ATTENDANCE_LOOKUP_FAILED',
        'Your check-in could not be checked.',
      );
    }
    if (existing) {
      return jsonResponse(
        {
          status: 'already_checked_in',
          service_title: service.title,
          checked_in_at: existing.checked_in_at,
        },
        200,
      );
    }

    if (
      !isCheckInOpen(
        {
          service_date: service.service_date,
          start_time: service.start_time,
          end_time: service.end_time,
        },
        Date.now(),
      )
    ) {
      return attendanceError(
        409,
        'CHECK_IN_CLOSED',
        'Check-in opens 30 minutes before the service and closes 30 minutes after it ends.',
      );
    }

    // The database unique key handles two scans arriving at the same time.
    const { data: attendance, error: insertError } = await serverClient
      .from('attendance')
      .insert({ user_id: user.id, service_id: service.id, method: 'qr' })
      .select('id, checked_in_at')
      .single();

    if (insertError?.code === '23505') {
      return jsonResponse(
        { status: 'already_checked_in', service_title: service.title },
        200,
      );
    }
    if (insertError || !attendance) {
      console.error('Attendance insert failed', {
        code: insertError?.code ?? 'UNKNOWN',
      });
      return attendanceError(
        500,
        'CHECK_IN_FAILED',
        'Your check-in could not be recorded.',
      );
    }

    return jsonResponse(
      {
        status: 'confirmed',
        service_title: service.title,
        checked_in_at: attendance.checked_in_at,
      },
      200,
    );
  } catch {
    return attendanceError(
      500,
      'CHECK_IN_FAILED',
      'Your check-in could not be completed.',
    );
  }
}

// ===============================================================
// EDGE FUNCTION ENTRY POINT
// ===============================================================

serve(handleCheckIn);
