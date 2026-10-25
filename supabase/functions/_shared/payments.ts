// ===============================================================
// payments.ts
// Validates payment inputs and centralizes trusted provider calls.
// Keeps payment amounts in integer kobo at the provider boundary.
// ===============================================================

// ===============================================================
// SAFE ERRORS AND REQUEST VALIDATION
// ===============================================================

export class PaymentError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ProviderError extends PaymentError {
  constructor(public readonly definitiveFailure = false) {
    super(
      502,
      'PAYMENT_PROVIDER_ERROR',
      'The payment provider could not complete this request. Please try again later.',
    );
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  ) {
    throw new PaymentError(415, 'JSON_REQUIRED', 'Send an application/json request body.');
  }

  const body = await request.text();
  if (body.length > 8192) {
    throw new PaymentError(413, 'REQUEST_TOO_LARGE', 'The request body is too large.');
  }

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new PaymentError(400, 'INVALID_JSON', 'The request body must contain valid JSON.');
  }
  if (!isRecord(value)) {
    throw new PaymentError(400, 'INVALID_JSON', 'The request body must be a JSON object.');
  }
  return value;
}

export function amountToMinor(amount: unknown): number {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount < 100 ||
    amount > 1_000_000
  ) {
    throw new PaymentError(
      400,
      'INVALID_AMOUNT',
      'Amount must be between NGN 100 and NGN 1,000,000.',
    );
  }

  // Decimal text avoids rejecting valid prices because of binary floating-point multiplication.
  const parts = amount.toString().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!parts) {
    throw new PaymentError(
      400,
      'INVALID_AMOUNT',
      'Amount must have no more than two decimal places.',
    );
  }
  return Number(parts[1]) * 100 + Number((parts[2] ?? '').padEnd(2, '0'));
}

export function validateFundId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new PaymentError(400, 'INVALID_FUND', 'Choose a valid giving fund.');
  }
  return value;
}

export function validateReference(value: unknown): string {
  // Permit earlier underscore references for lookup; new references use only letters, digits and hyphens.
  if (typeof value !== 'string' || !/^[A-Za-z0-9._=-]{1,100}$/.test(value)) {
    throw new PaymentError(400, 'INVALID_REFERENCE', 'Provide a valid payment reference.');
  }
  return value;
}

export function validateEmail(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    throw new PaymentError(
      400,
      'EMAIL_REQUIRED',
      'A valid checkout email address is required for Paystack.',
    );
  }
  return value;
}

// ===============================================================
// PROVIDER REQUESTS AND VERIFIED TRANSACTION DATA
// ===============================================================

export async function requestPaystack(
  path: string,
  secret: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`https://api.paystack.co${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result: unknown = await response.json();
    if (!response.ok || !isRecord(result) || result.status !== true || !isRecord(result.data)) {
      // A timeout or 5xx response is uncertain: never mark a possibly created transaction as definitively failed.
      throw new ProviderError(isRecord(result) && result.status === false && response.status < 500);
    }
    return result;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError();
  } finally {
    clearTimeout(timeout);
  }
}

export function settlementArguments(value: unknown, expectedReference?: string) {
  if (!isRecord(value) || value.status !== 'success') {
    throw new ProviderError();
  }
  const reference = validateReference(value.reference);
  const providerId =
    typeof value.id === 'number' && Number.isSafeInteger(value.id) ? String(value.id) : value.id;

  if (
    (expectedReference !== undefined && reference !== expectedReference) ||
    typeof providerId !== 'string' ||
    !/^[1-9]\d*$/.test(providerId) ||
    providerId.length > 30 ||
    typeof value.amount !== 'number' ||
    !Number.isSafeInteger(value.amount) ||
    value.amount < 10_000 ||
    value.amount > 100_000_000 ||
    value.currency !== 'NGN' ||
    typeof value.channel !== 'string' ||
    value.channel.length < 1 ||
    value.channel.length > 50 ||
    typeof value.paid_at !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value.paid_at,
    ) ||
    !Number.isFinite(Date.parse(value.paid_at))
  ) {
    throw new PaymentError(
      409,
      'PAYMENT_MISMATCH',
      'The payment details do not match a supported transaction.',
    );
  }

  return {
    p_reference: reference,
    p_amount_minor: value.amount,
    p_currency: value.currency,
    p_provider_transaction_id: providerId,
    p_channel: value.channel,
    p_paid_at: new Date(value.paid_at).toISOString(),
  };
}

// ===============================================================
// RESPONSE AND DATABASE ERROR HANDLING
// ===============================================================

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...Object.fromEntries(new Headers(headers)), 'Content-Type': 'application/json' },
  });
}

export function paymentFailure(error: unknown, headers: HeadersInit = {}): Response {
  const failure =
    error instanceof PaymentError
      ? error
      : new PaymentError(500, 'PAYMENT_ERROR', 'The payment request could not be completed.');

  // Do not write provider responses, credentials, references, or personal information to logs.
  if (failure.status >= 500) console.error('Payment request failed', { code: failure.code });
  return jsonResponse(
    { error: { code: failure.code, message: failure.message } },
    failure.status,
    headers,
  );
}

export function settlementError(error: { code?: string; message?: string }): PaymentError {
  if (error.code === 'P0002') {
    return new PaymentError(404, 'OFFERING_NOT_FOUND', 'The payment reference was not found.');
  }
  if (error.code === '22023' || error.code === '23505' || error.code === '23514') {
    return new PaymentError(
      409,
      'PAYMENT_MISMATCH',
      'The payment does not match the stored offering.',
    );
  }
  return new PaymentError(
    500,
    'SETTLEMENT_FAILED',
    'The payment could not be recorded. Please try again later.',
  );
}
