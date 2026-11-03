// ===============================================================
// apps/mobile/tests/paystack-return.test.mjs
// Keep provider callback redirects fixed and reference-only.
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPaystackAppReturnUrl } from '../../../supabase/functions/_shared/paystack-return.ts';

// ===============================================================
// PROVIDER RETURN VALIDATION REGRESSIONS
// ===============================================================

test('valid callback reference is encoded into the fixed TPC app link', () => {
  const redirect = buildPaystackAppReturnUrl(
    new URLSearchParams({ reference: 'TPC-abc-123' }),
  );

  assert.equal(redirect, 'tpc://payment-return?reference=TPC-abc-123');
});

test('mismatched provider references return a safe app error state', () => {
  const redirect = buildPaystackAppReturnUrl(
    new URLSearchParams({ reference: 'TPC-a', trxref: 'TPC-b' }),
  );

  assert.equal(redirect, 'tpc://payment-return?error=reference_mismatch');
});

test('missing and malformed references never enter the app URL', () => {
  assert.equal(
    buildPaystackAppReturnUrl(new URLSearchParams()),
    'tpc://payment-return?error=missing_reference',
  );
  assert.equal(
    buildPaystackAppReturnUrl(
      new URLSearchParams({ reference: 'bad/reference' }),
    ),
    'tpc://payment-return?error=missing_reference',
  );
});
