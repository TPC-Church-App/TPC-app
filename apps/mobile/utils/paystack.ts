// ===============================================================
// apps/mobile/utils/paystack.ts
// Validate payment handoff and verification responses from Supabase.
// ===============================================================

export const VERIFIED_PAYMENT_STATUSES = [
  'successful',
  'abandoned',
  'failed',
  'ongoing',
  'pending',
  'processing',
  'queued',
  'reversed',
] as const;

export type VerifiedPaymentStatus = (typeof VERIFIED_PAYMENT_STATUSES)[number];

type PaystackCheckout = {
  authorizationUrl: string;
  reference: string;
};

// ===============================================================
// VALIDATE PAYSTACK INITIALIZATION RESPONSE
// ===============================================================

export function parsePaystackCheckout(value: unknown): PaystackCheckout | null {
  if (!isRecord(value) || value.status !== true || !isRecord(value.data)) {
    return null;
  }

  const { authorization_url, access_code, reference } = value.data;
  if (
    typeof authorization_url !== 'string' ||
    typeof access_code !== 'string' ||
    !access_code.trim() ||
    typeof reference !== 'string' ||
    !/^[A-Za-z0-9._=-]{1,100}$/.test(reference)
  ) {
    return null;
  }

  try {
    const checkoutUrl = new URL(authorization_url);
    if (
      checkoutUrl.protocol !== 'https:' ||
      checkoutUrl.hostname !== 'checkout.paystack.com' ||
      checkoutUrl.port !== '' ||
      checkoutUrl.pathname.length < 2 ||
      checkoutUrl.username !== '' ||
      checkoutUrl.password !== ''
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { authorizationUrl: authorization_url, reference };
}

// ===============================================================
// ACCEPT ONLY DOCUMENTED SERVER VERIFICATION STATUSES
// ===============================================================

export function parsePaymentVerification(
  value: unknown,
): VerifiedPaymentStatus | null {
  if (!isRecord(value) || typeof value.status !== 'string') return null;

  return VERIFIED_PAYMENT_STATUSES.includes(
    value.status as VerifiedPaymentStatus,
  )
    ? (value.status as VerifiedPaymentStatus)
    : null;
}

// ===============================================================
// NARROW UNTRUSTED JSON VALUES BEFORE READING FIELDS
// ===============================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
