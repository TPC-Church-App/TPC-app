// ===============================================================
// apps/mobile/tests/member-demo.test.mjs
// Node 24: pure model regressions, with no native modules, network or real data.
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';
import {
  profileError,
  validDemoPayment,
  applyDemoReturn,
  receiptAvailable,
  eligibleWitness,
  transitionQueue,
  queueExpired,
  uniqueReadIds,
  PAYMENT_STATUSES,
} from '../utils/member-demo.ts';
import { parseGivingAmount } from '../utils/giving.ts';
import { MEMBER_ROUTES } from '../constants/member-pages.ts';
const payment = {
  reference: 'DEMO-test-001',
  fundId: 'demo-offering',
  fundName: 'Offering',
  category: 'offering',
  amountMinor: 10000,
  status: 'pending',
  createdAt: '2026-11-01T09:00:00Z',
};
const now = Date.parse('2026-11-01T10:00:00Z');
const queue = {
  state: 'awaitingWitness',
  serviceId: 'same-service',
  uploadDeadlineAt: '2026-11-02T10:00:00Z',
};
const witness = {
  id: 'other-member',
  name: 'Sample member',
  verified: true,
  confirmedServiceId: 'same-service',
};

// ===============================================================
// PROFILE AND MONEY VALIDATION REGRESSIONS
// ===============================================================

test('registration requires both names and accepts age four', () => {
  assert.ok(profileError('', 'Member', '4'));
  assert.ok(profileError('Test', '', '4'));
  for (const age of ['', '3', '4.5', '-4', 'abc'])
    assert.ok(profileError('Test', 'Member', age));
  assert.equal(profileError('Test', 'Member', '4'), '');
  assert.equal(profileError('Test', 'Member', '104'), '');
  assert.ok(profileError('x'.repeat(101), 'Member', '4'));
  for (const length of [80, 81, 99, 100])
    assert.equal(profileError('x'.repeat(length), 'y'.repeat(length), '4'), '');
  assert.ok(profileError('Test', 'y'.repeat(101), '4'));
});
test('amount parsing keeps exact kobo and rejects malformed/out-of-range money', () => {
  assert.deepEqual(parseGivingAmount('1,000.25'), {
    valid: true,
    amountMinor: 100025,
  });
  assert.deepEqual(parseGivingAmount('100'), {
    valid: true,
    amountMinor: 10000,
  });
  for (const value of [
    '99.99',
    '1,000,000.01',
    '1,00',
    '100.001',
    '-100',
    '1e3',
    'NaN',
    '',
  ])
    assert.equal(parseGivingAmount(value).valid, false);
});
test('saved payment validation rejects real, malformed and unsafe records', () => {
  assert.equal(validDemoPayment(payment), true);
  for (const bad of [
    { ...payment, reference: 'TPC-real-reference' },
    { ...payment, amountMinor: NaN },
    { ...payment, amountMinor: 10000.5 },
    { ...payment, status: 'made-up' },
    { ...payment, createdAt: 'invalid' },
    { ...payment, category: 'unknown' },
    null,
  ])
    assert.equal(validDemoPayment(bad), false);
});

// ===============================================================
// PAYMENT OWNERSHIP, REPLAY AND RECEIPT REGRESSIONS
// ===============================================================

test('unknown return references cannot create or modify a checkout', () => {
  assert.deepEqual(applyDemoReturn([payment], 'DEMO-unknown', 'successful'), [
    payment,
  ]);
  assert.equal(receiptAvailable(undefined), false);
});
test('successful callbacks are idempotent and success does not regress to pending', () => {
  const once = applyDemoReturn([payment], payment.reference, 'successful');
  const twice = applyDemoReturn(once, payment.reference, 'successful');
  assert.deepEqual(twice, once);
  assert.equal(twice.length, 1);
  assert.equal(receiptAvailable(twice[0]), true);
  assert.deepEqual(applyDemoReturn(twice, payment.reference, 'pending'), twice);
});
test('reversal removes receipt eligibility and cannot be replayed into success', () => {
  const success = applyDemoReturn([payment], payment.reference, 'successful');
  const reversed = applyDemoReturn(success, payment.reference, 'reversed');
  assert.equal(receiptAvailable(reversed[0]), false);
  assert.deepEqual(
    applyDemoReturn(reversed, payment.reference, 'successful'),
    reversed,
  );
});
test('only successful saved outcomes produce demo receipts', () => {
  for (const status of PAYMENT_STATUSES)
    assert.equal(
      receiptAvailable({ ...payment, status }),
      status === 'successful',
    );
});
test('failed and cancelled payments require a new checkout reference', () => {
  for (const status of ['failed', 'abandoned']) {
    const terminal = { ...payment, status };
    assert.deepEqual(
      applyDemoReturn([terminal], payment.reference, 'successful'),
      [terminal],
    );
  }
});

// ===============================================================
// WITNESS AND OFFLINE QUEUE REGRESSIONS
// ===============================================================

test('witness must be verified, present at the same service, and not the requester', () => {
  assert.equal(eligibleWitness(witness, queue.serviceId, 'demo-self'), true);
  assert.equal(
    eligibleWitness(
      { ...witness, verified: false },
      queue.serviceId,
      'demo-self',
    ),
    false,
  );
  assert.equal(
    eligibleWitness(
      { ...witness, confirmedServiceId: 'other' },
      queue.serviceId,
      'demo-self',
    ),
    false,
  );
  assert.equal(
    eligibleWitness(
      { ...witness, id: 'demo-self' },
      queue.serviceId,
      'demo-self',
    ),
    false,
  );
});
test('no-location evidence cannot bypass witness confirmation', () => {
  assert.deepEqual(transitionQueue(queue, 'confirmed', undefined, now), queue);
  const requested = transitionQueue(queue, 'witnessRequested', undefined, now);
  assert.equal(requested.state, 'witnessRequested');
  assert.deepEqual(
    transitionQueue(requested, 'queued', { ...witness, verified: false }, now),
    requested,
  );
  const confirmedWitness = transitionQueue(requested, 'queued', witness, now);
  assert.equal(confirmedWitness.state, 'queued');
  assert.equal(confirmedWitness.witnessId, witness.id);
  assert.equal(
    transitionQueue(confirmedWitness, 'confirmed', undefined, now).state,
    'confirmed',
  );
});
test('sync errors retain evidence and can retry before the deadline', () => {
  const queued = {
    ...queue,
    state: 'queued',
    scannedAt: '2026-11-01T09:00:00Z',
  };
  const error = transitionQueue(queued, 'syncError', undefined, now);
  assert.equal(error.scannedAt, queued.scannedAt);
  assert.equal(
    transitionQueue(error, 'queued', undefined, now).state,
    'queued',
  );
});
test('upload deadline is inclusive and cannot be bypassed by sync or a witness', () => {
  const deadline = Date.parse(queue.uploadDeadlineAt);
  assert.equal(queueExpired(queue.uploadDeadlineAt, deadline), false);
  assert.equal(queueExpired(queue.uploadDeadlineAt, deadline + 1), true);
  assert.equal(queueExpired('invalid', now), true);
  assert.equal(
    transitionQueue(
      { ...queue, state: 'queued' },
      'confirmed',
      undefined,
      deadline + 1,
    ).state,
    'expired',
  );
  assert.equal(
    transitionQueue(
      { ...queue, state: 'witnessRequested' },
      'queued',
      witness,
      deadline + 1,
    ).state,
    'expired',
  );
});
test('terminal attendance results cannot be silently changed by replay', () => {
  for (const state of ['confirmed', 'rejected', 'expired']) {
    const terminal = { ...queue, state };
    assert.deepEqual(
      transitionQueue(terminal, 'queued', witness, now),
      terminal,
    );
  }
});

// ===============================================================
// READ STATE AND MENU DESTINATION REGRESSIONS
// ===============================================================

test('message read state removes duplicate and unknown IDs', () => {
  assert.deepEqual(uniqueReadIds(['a', 'a', 'unknown', 42, 'b'], ['a', 'b']), [
    'a',
    'b',
  ]);
  assert.deepEqual(uniqueReadIds(null, ['a']), []);
});
test('every member-menu destination has a route file', async () => {
  for (const route of Object.values(MEMBER_ROUTES)) {
    const file = new URL(
      '../app/' + route.replace(/^\//, '') + '.tsx',
      import.meta.url,
    );
    await access(file);
  }
});
test('additional routes stay navigable rather than using href-null hiding', async () => {
  const layout = await readFile(
    new URL('../app/(tabs)/_layout.tsx', import.meta.url),
    'utf8',
  );
  assert.equal(
    /href\s*:\s*null/.test(layout.replace(/\{\/\*[^]*?\*\/\}/g, '')),
    false,
  );
  for (const name of [
    'checkout',
    'payment-return',
    'receipt',
    'settings',
    'messages',
    'sermons',
    'community',
  ])
    await access(new URL('../app/(tabs)/' + name + '.tsx', import.meta.url));
});
