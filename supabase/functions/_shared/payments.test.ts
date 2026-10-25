// ===============================================================
// payments.test.ts
// Exercises payment boundaries without credentials, a database,
// or requests to Paystack. Uses only Deno's built-in test runner.
// ===============================================================

import {
  amountToMinor,
  PaymentError,
  readJson,
  settlementArguments,
  settlementError,
  validateEmail,
  validateFundId,
  validateReference,
} from './payments.ts';

// ===============================================================
// LOCAL ASSERTIONS AND FIXTURES
// ===============================================================

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectPaymentError(run: () => unknown, code: string): void {
  try {
    run();
  } catch (error) {
    assert(error instanceof PaymentError, 'Expected a safe payment error.');
    assert(error.code === code, `Expected ${code}, received ${error.code}.`);
    return;
  }
  throw new Error(`Expected ${code}, but the operation succeeded.`);
}

async function expectRequestError(request: Request, code: string): Promise<void> {
  try {
    await readJson(request);
  } catch (error) {
    assert(error instanceof PaymentError, 'Expected a safe request error.');
    assert(error.code === code, `Expected ${code}, received ${error.code}.`);
    return;
  }
  throw new Error(`Expected ${code}, but the request was accepted.`);
}

const transaction = {
  id: 12345,
  status: 'success',
  reference: 'TPC-verified-reference',
  amount: 10025,
  currency: 'NGN',
  channel: 'card',
  paid_at: '2026-10-22T12:00:00+01:00',
};

// ===============================================================
// AMOUNT, IDENTIFIER, AND EMAIL BOUNDARIES
// ===============================================================

Deno.test('amounts become exact integer kobo at accepted boundaries', () => {
  assert(amountToMinor(100) === 10000, 'Minimum amount must remain valid.');
  assert(amountToMinor(100.25) === 10025, 'Two decimal places must be retained.');
  assert(amountToMinor(100.1) === 10010, 'One decimal place must be padded.');
  assert(
    amountToMinor(101.14) === 10114,
    'Binary floating-point must not reject a valid decimal price.',
  );
  assert(amountToMinor(1_000_000) === 100_000_000, 'Maximum amount must remain valid.');
});

for (const amount of [99.99, 1_000_000.01, 100.001, '100', null, NaN, Infinity]) {
  Deno.test(`reject unsupported amount: ${String(amount)}`, () => {
    expectPaymentError(() => amountToMinor(amount), 'INVALID_AMOUNT');
  });
}

Deno.test('fund identifiers accept a UUID but reject arbitrary paths', () => {
  const fund = '2c439a29-217b-4530-bc22-07e6fdfbad99';
  assert(validateFundId(fund) === fund, 'A valid fund ID must survive unchanged.');
  expectPaymentError(() => validateFundId('../funds'), 'INVALID_FUND');
});

Deno.test('reference validation retains older references without accepting URL paths', () => {
  assert(
    validateReference('TPC_legacy') === 'TPC_legacy',
    'Existing references must remain readable.',
  );
  assert(validateReference('TPC-new') === 'TPC-new', 'New references must remain readable.');
  expectPaymentError(() => validateReference('../other/payment'), 'INVALID_REFERENCE');
  expectPaymentError(() => validateReference(''), 'INVALID_REFERENCE');
});

Deno.test('checkout requires an actual email-shaped value', () => {
  assert(validateEmail('member@example.org') === 'member@example.org', 'Keep the supplied email.');
  for (const email of [undefined, '', '08000000000', 'a b@example.org']) {
    expectPaymentError(() => validateEmail(email), 'EMAIL_REQUIRED');
  }
});

// ===============================================================
// JSON REQUEST BOUNDARIES
// ===============================================================

Deno.test('readJson accepts a JSON object with a content-type charset', async () => {
  const result = await readJson(
    new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '{"amount":100}',
    }),
  );
  assert(result.amount === 100, 'The object body must be returned.');
});

Deno.test('readJson rejects a missing JSON content type', async () => {
  await expectRequestError(
    new Request('https://example.test', {
      method: 'POST',
      body: '{}',
    }),
    'JSON_REQUIRED',
  );
});

for (const body of ['{', '[]', 'null']) {
  Deno.test(`readJson rejects malformed or non-object body: ${body}`, async () => {
    await expectRequestError(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      'INVALID_JSON',
    );
  });
}

Deno.test('readJson rejects an oversized request body', async () => {
  await expectRequestError(
    new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(8200) }),
    }),
    'REQUEST_TOO_LARGE',
  );
});

// ===============================================================
// TRUSTED PROVIDER DATA AND SETTLEMENT ERRORS
// ===============================================================

Deno.test('successful provider data maps to normalized settlement arguments', () => {
  const result = settlementArguments(transaction, transaction.reference);
  assert(result.p_reference === transaction.reference, 'Reference must match.');
  assert(result.p_provider_transaction_id === '12345', 'Provider IDs must be text-safe.');
  assert(result.p_amount_minor === 10025, 'Provider amount must remain integer kobo.');
  assert(result.p_currency === 'NGN', 'Currency must remain NGN.');
  assert(result.p_paid_at === '2026-10-22T11:00:00.000Z', 'Normalize timestamp to UTC.');
});

const rejectedProviderFields: Array<[string, unknown]> = [
  ['reference', 'TPC-different-reference'],
  ['amount', 100.25],
  ['amount', 9999],
  ['currency', 'USD'],
  ['id', Number.MAX_SAFE_INTEGER + 1],
  ['channel', ''],
  ['paid_at', 'not-a-date'],
  ['paid_at', '2026-10-22'],
  ['paid_at', '2026-10-22T12:00:00'],
];

for (const [field, value] of rejectedProviderFields) {
  Deno.test(`reject unsupported provider ${field}: ${String(value)}`, () => {
    expectPaymentError(
      () => settlementArguments({ ...transaction, [field]: value }, transaction.reference),
      'PAYMENT_MISMATCH',
    );
  });
}

Deno.test('database settlement errors map to stable non-sensitive responses', () => {
  assert(settlementError({ code: 'P0002' }).status === 404, 'Unknown reference is not found.');
  assert(settlementError({ code: '22023' }).status === 409, 'Mismatch must not become success.');
  assert(
    settlementError({ code: '23505' }).status === 409,
    'Conflicting payment must not become success.',
  );
  const error = settlementError({ code: 'XX000', message: 'private database detail' });
  assert(error.status === 500, 'Unexpected database failures need a retryable failure.');
  assert(!error.message.includes('private'), 'Database details must remain private.');
});
