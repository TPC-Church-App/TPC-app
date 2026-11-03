// ===============================================================
// apps/mobile/tests/attendance.test.mjs
// Run with Node's built-in test runner. No native modules or network are used.
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCheckInWindow as getServerCheckInWindow,
  isCheckInOpen,
} from '../../../supabase/functions/_shared/attendance-window.ts';
import {
  getAttendanceCheckInErrorMessage,
  parseAttendanceCheckInResult,
} from '../utils/attendance-check-in.ts';
import {
  DEMO_SERVICE_PASS,
  getAttendanceWindow,
  getCheckInState,
  isDemoServicePass,
  isValidLocationEvidence,
  isWithinUploadDeadline,
  retainFirstAttempt,
} from '../utils/attendance.ts';

const service = {
  id: 'test-service',
  name: 'Test service',
  startsAt: '2026-11-01T09:00:00+01:00',
  endsAt: '2026-11-01T11:00:00+01:00',
};
const window = getAttendanceWindow(service);

// ===============================================================
// CHECK-IN WINDOW AND DEADLINE REGRESSIONS
// ===============================================================

test('opens exactly 30 minutes before the service starts', () => {
  assert.equal(
    getCheckInState(service, Date.parse('2026-11-01T08:29:59.999+01:00')),
    'notOpen',
  );
  assert.equal(
    getCheckInState(service, Date.parse('2026-11-01T08:30:00+01:00')),
    'open',
  );
});
test('closes 30 minutes after the service ENDS', () => {
  assert.equal(
    getCheckInState(service, Date.parse('2026-11-01T11:30:00+01:00')),
    'open',
  );
  assert.equal(
    getCheckInState(service, Date.parse('2026-11-01T11:30:00.001+01:00')),
    'closed',
  );
});
test('24-hour deadline is measured from service end', () => {
  assert.equal(
    new Date(window.uploadDeadlineAt).toISOString(),
    '2026-11-02T10:00:00.000Z',
  );
  assert.equal(isWithinUploadDeadline(service, window.uploadDeadlineAt), true);
  assert.equal(
    isWithinUploadDeadline(service, window.uploadDeadlineAt + 1),
    false,
  );
});
test('rejects malformed and reversed schedules', () => {
  assert.equal(getAttendanceWindow({ ...service, endsAt: 'invalid' }), null);
  assert.equal(
    getCheckInState({ ...service, endsAt: service.startsAt }),
    'unavailable',
  );
  assert.equal(getCheckInState(service, NaN), 'unavailable');
  assert.equal(isWithinUploadDeadline(service, NaN), false);
});

// ===============================================================
// SERVER CHECK-IN WINDOW REGRESSIONS
// ===============================================================

const serverSchedule = {
  service_date: '2026-11-01',
  start_time: '09:00:00',
  end_time: '11:00:00',
};

test('server check-in opens 30 minutes before and closes 30 minutes after service', () => {
  const window = getServerCheckInWindow(serverSchedule);
  assert.ok(window);
  assert.equal(window.opensAt, Date.parse('2026-11-01T08:30:00+01:00'));
  assert.equal(window.closesAt, Date.parse('2026-11-01T11:30:00+01:00'));
  assert.equal(
    isCheckInOpen(serverSchedule, Date.parse('2026-11-01T08:29:59.999+01:00')),
    false,
  );
  assert.equal(
    isCheckInOpen(serverSchedule, Date.parse('2026-11-01T08:30:00+01:00')),
    true,
  );
  assert.equal(
    isCheckInOpen(serverSchedule, Date.parse('2026-11-01T11:30:00+01:00')),
    true,
  );
  assert.equal(
    isCheckInOpen(serverSchedule, Date.parse('2026-11-01T11:30:00.001+01:00')),
    false,
  );
});

test('server check-in rejects invalid dates and reversed service times', () => {
  assert.equal(
    getServerCheckInWindow({ ...serverSchedule, service_date: '2026-02-30' }),
    null,
  );
  assert.equal(
    getServerCheckInWindow({ ...serverSchedule, end_time: '08:59:00' }),
    null,
  );
  assert.equal(isCheckInOpen(serverSchedule, Number.NaN), false);
});

test('server check-in accepts Postgres fractional seconds', () => {
  const fractional = {
    ...serverSchedule,
    start_time: '09:00:00.123456',
    end_time: '11:00:00.123456',
  };
  const window = getServerCheckInWindow(fractional);
  assert.ok(window);
  assert.equal(window.opensAt, Date.parse('2026-11-01T08:30:00.123+01:00'));
});

test('attendance UI accepts only confirmed server response shapes', () => {
  assert.deepEqual(
    parseAttendanceCheckInResult({
      status: 'confirmed',
      service_title: 'Sunday worship',
      checked_in_at: '2026-11-01T08:30:00Z',
    }),
    {
      status: 'confirmed',
      serviceTitle: 'Sunday worship',
      checkedInAt: '2026-11-01T08:30:00Z',
    },
  );
  assert.equal(
    parseAttendanceCheckInResult({
      status: 'pending',
      service_title: 'Sunday worship',
    }),
    null,
  );
  assert.equal(
    parseAttendanceCheckInResult({
      status: 'confirmed',
      checked_in_at: 'invalid',
    })?.checkedInAt,
    null,
  );
});

test('attendance UI maps known endpoint errors and hides arbitrary server text', () => {
  assert.equal(
    getAttendanceCheckInErrorMessage({ error: { code: 'CHECK_IN_CLOSED' } }),
    'Check-in is not open for this service right now.',
  );
  assert.equal(
    getAttendanceCheckInErrorMessage({ error: { code: 'PROFILE_INCOMPLETE' } }),
    'Complete your member profile before checking in.',
  );
  assert.match(
    getAttendanceCheckInErrorMessage({
      error: { code: 'UNKNOWN', message: 'database secret or stack trace' },
    }),
    /could not be confirmed/i,
  );
});

// ===============================================================
// DEMO PASS, EVIDENCE AND DUPLICATE REGRESSIONS
// ===============================================================

test('only the labelled demo pass is recognized, never an arbitrary URL', () => {
  assert.equal(isDemoServicePass(DEMO_SERVICE_PASS), true);
  assert.equal(isDemoServicePass('https://example.com'), false);
  assert.equal(isDemoServicePass('123456'), false);
  assert.equal(isDemoServicePass('x'.repeat(257)), false);
});
test('location evidence needs valid coordinates, time and optional accuracy', () => {
  const location = {
    latitude: 6.5,
    longitude: 3.4,
    accuracy: 12,
    observedAt: service.startsAt,
  };
  assert.equal(isValidLocationEvidence(location), true);
  assert.equal(isValidLocationEvidence({ ...location, accuracy: null }), true);
  assert.equal(isValidLocationEvidence({ ...location, latitude: 91 }), false);
  assert.equal(
    isValidLocationEvidence({ ...location, longitude: -181 }),
    false,
  );
  assert.equal(isValidLocationEvidence({ ...location, accuracy: -1 }), false);
  assert.equal(
    isValidLocationEvidence({ ...location, observedAt: 'invalid' }),
    false,
  );
});
test('a repeated scan preserves the original scan time and evidence', () => {
  const first = {
    serviceId: service.id,
    scannedAt: service.startsAt,
    state: 'queued',
  };
  const retry = { ...first, scannedAt: service.endsAt };
  assert.equal(retainFirstAttempt(first, retry), first);
  assert.equal(retainFirstAttempt(null, retry), retry);
});
