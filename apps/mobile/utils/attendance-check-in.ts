// ===============================================================
// apps/mobile/utils/attendance-check-in.ts
// Parse the trusted attendance endpoint response without exposing raw errors.
// ===============================================================

export type AttendanceCheckInResult = {
  status: 'confirmed' | 'already_checked_in';
  serviceTitle: string | null;
  checkedInAt: string | null;
};

const CHECK_IN_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Sign in before checking in.',
  CONTACT_NOT_VERIFIED:
    'Verify your email address or phone number before checking in.',
  PROFILE_INCOMPLETE: 'Complete your member profile before checking in.',
  PROFILE_CHECK_FAILED:
    'Your member profile could not be checked. Try again shortly.',
  INVALID_QR_CODE: 'This service QR code is not available.',
  CHECK_IN_CLOSED: 'Check-in is not open for this service right now.',
  SERVICE_LOOKUP_FAILED: 'The service could not be checked. Try again shortly.',
  ATTENDANCE_LOOKUP_FAILED:
    'Your check-in status could not be loaded. Try again.',
  CHECK_IN_FAILED: 'Your check-in could not be recorded. Try again.',
};

// ===============================================================
// ACCEPT ONLY THE DOCUMENTED CONFIRMED RESPONSE SHAPE
// ===============================================================

export function parseAttendanceCheckInResult(
  value: unknown,
): AttendanceCheckInResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (record.status !== 'confirmed' && record.status !== 'already_checked_in') {
    return null;
  }

  return {
    status: record.status,
    serviceTitle:
      typeof record.service_title === 'string' &&
      record.service_title.length <= 120
        ? record.service_title
        : null,
    checkedInAt:
      typeof record.checked_in_at === 'string' &&
      Number.isFinite(Date.parse(record.checked_in_at))
        ? record.checked_in_at
        : null,
  };
}

// ===============================================================
// MAP SERVER ERROR CODES TO SAFE MEMBER-FACING COPY
// Never display an arbitrary server message or provider response.
// ===============================================================

export function getAttendanceCheckInErrorMessage(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Your check-in could not be confirmed. Check your connection and try again.';
  }

  const error = (value as Record<string, unknown>).error;
  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    return 'Your check-in could not be confirmed. Check your connection and try again.';
  }

  const code = (error as Record<string, unknown>).code;
  return typeof code === 'string' && CHECK_IN_ERROR_MESSAGES[code]
    ? CHECK_IN_ERROR_MESSAGES[code]
    : 'Your check-in could not be confirmed. Check your connection and try again.';
}
