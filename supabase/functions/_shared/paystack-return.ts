// ===============================================================
// supabase/functions/_shared/paystack-return.ts
// Build a fixed app deep link from untrusted provider callback parameters.
// ===============================================================

const APP_RETURN_URL = 'tpc://payment-return';
const REFERENCE_PATTERN = /^[A-Za-z0-9._=-]{1,100}$/;

// ===============================================================
// VALIDATE THE REFERENCE BEFORE ADDING IT TO THE APP LINK
// The app treats this value only as a lookup key and verifies with the server.
// ===============================================================

export function buildPaystackAppReturnUrl(params: URLSearchParams): string {
  const reference = params.get('reference');
  const transactionReference = params.get('trxref');

  if (reference && transactionReference && reference !== transactionReference) {
    return `${APP_RETURN_URL}?error=reference_mismatch`;
  }

  const selectedReference = reference ?? transactionReference;
  if (!selectedReference || !REFERENCE_PATTERN.test(selectedReference)) {
    return `${APP_RETURN_URL}?error=missing_reference`;
  }

  const returnUrl = new URL(APP_RETURN_URL);
  returnUrl.searchParams.set('reference', selectedReference);
  return returnUrl.toString();
}
