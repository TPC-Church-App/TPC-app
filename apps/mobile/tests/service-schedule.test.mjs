// ===============================================================
// File: apps/mobile/tests/service-schedule.test.mjs
// Description: Unit tests for live & recurring service schedule resolution.
// Author: Josiah Ewumi
// ===============================================================

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TPC_SCHEDULES,
  formatRelativeTime,
  formatServiceDateTime,
  getGreetingForHour,
  getServiceCountdown,
  resolveNextService,
} from '../utils/service-schedule.ts';

test('selects soonest active dated service within check-in window', () => {
  const now = Date.parse('2026-11-12T08:40:00+01:00');
  const services = [
    {
      id: 'past',
      title: 'Friday Vigil',
      service_date: '2026-11-06',
      start_time: '22:00:00',
      end_time: '23:59:00',
      is_active: true,
    },
    {
      id: 'sunday',
      title: 'Sunday Worship',
      service_date: '2026-11-12',
      start_time: '09:00:00',
      end_time: '11:30:00',
      location: 'Main Auditorium',
      is_active: true,
    },
    {
      id: 'later',
      title: 'Midweek Service',
      service_date: '2026-11-15',
      start_time: '18:00:00',
      end_time: '20:00:00',
      is_active: true,
    },
  ];

  const next = resolveNextService(services, [], now);
  assert.ok(next);
  assert.equal(next.id, 'sunday');
  assert.equal(next.location, 'Main Auditorium');
  assert.equal(formatServiceDateTime(next), 'Thu 12 Nov • 9:00 AM');
});

test('computes next weekly recurring occurrence and lets dated override win', () => {
  // Wednesday 25 Nov 2026 11:00 WAT
  const now = Date.parse('2026-11-25T11:00:00+01:00');
  const schedules = [
    {
      id: 'weekly-sun',
      title: 'Sunday Worship',
      period_type: 'weekly',
      period_label: 'Every Sunday',
      day_of_week: 0,
      day_of_month: null,
      start_time: '09:00:00',
      end_time: '11:30:00',
      effective_from: '2026-11-01',
      effective_until: null,
      location: 'Main Auditorium',
      is_active: true,
    },
  ];

  const fromTemplate = resolveNextService([], schedules, now);
  assert.ok(fromTemplate);
  assert.equal(fromTemplate.source, 'recurring');
  assert.equal(fromTemplate.serviceDate, '2026-11-29');

  // Dated override for the same date & title takes precedence
  const datedOverride = [
    {
      id: 'override-29',
      title: 'Sunday Worship',
      service_date: '2026-11-29',
      start_time: '10:00:00',
      end_time: '12:30:00',
      location: 'Youth Hall',
      qr_code: 'TPC-SUN-29',
      is_active: true,
    },
  ];

  const merged = resolveNextService(datedOverride, schedules, now);
  assert.ok(merged);
  assert.equal(merged.source, 'dated');
  assert.equal(merged.id, 'override-29');
  assert.equal(merged.location, 'Youth Hall');
  assert.equal(merged.qrCode, 'TPC-SUN-29');
});

test('computes monthly recurring schedule respecting month boundaries', () => {
  const now = Date.parse('2026-11-15T10:00:00+01:00');
  const schedules = [
    {
      id: 'monthly-thanksgiving',
      title: 'Thanksgiving Sunday',
      period_type: 'monthly',
      period_label: '1st of every month',
      day_of_week: null,
      day_of_month: 1,
      start_time: '08:30:00',
      end_time: '11:30:00',
      effective_from: '2026-01-01',
      effective_until: null,
      is_active: true,
    },
  ];

  const next = resolveNextService([], schedules, now);
  assert.ok(next);
  assert.equal(next.serviceDate, '2026-12-01');
});

test('reports accurate countdown badges across upcoming, check-in open, and live states', () => {
  const svc = resolveNextService(
    [
      {
        id: 'svc-1',
        title: 'Sunday Worship',
        service_date: '2026-11-29',
        start_time: '09:00:00',
        end_time: '11:00:00',
        is_active: true,
      },
    ],
    [],
    Date.parse('2026-11-29T06:00:00+01:00'),
  );
  assert.ok(svc);

  assert.equal(
    getServiceCountdown(svc, Date.parse('2026-11-29T06:45:00+01:00')).status,
    'upcoming',
  );
  assert.equal(
    getServiceCountdown(svc, Date.parse('2026-11-29T06:45:00+01:00'))
      .badgeLabel,
    'In 2h 15m',
  );
  assert.equal(
    getServiceCountdown(svc, Date.parse('2026-11-29T08:35:00+01:00')).status,
    'check_in_open',
  );
  assert.equal(
    getServiceCountdown(svc, Date.parse('2026-11-29T09:30:00+01:00')).status,
    'live',
  );
});

test('formats relative announcement times and WAT greetings', () => {
  const now = Date.parse('2026-11-25T11:00:00+01:00');
  assert.equal(
    formatRelativeTime('2026-11-25T10:59:45+01:00', now),
    'Just now',
  );
  assert.equal(formatRelativeTime('2026-11-25T09:00:00+01:00', now), '2h ago');
  assert.equal(formatRelativeTime('2026-11-24T11:00:00+01:00', now), '1d ago');

  assert.equal(
    getGreetingForHour(Date.parse('2026-11-25T09:00:00+01:00')),
    'Good morning,',
  );
  assert.equal(
    getGreetingForHour(Date.parse('2026-11-25T14:00:00+01:00')),
    'Good afternoon,',
  );
  assert.equal(
    getGreetingForHour(Date.parse('2026-11-25T19:00:00+01:00')),
    'Good evening,',
  );
});

test('DEFAULT_TPC_SCHEDULES resolves Wednesday Midweek, Sunday Workers Prayer, and Sunday Worship in order', () => {
  // Wednesday morning 10:00 WAT -> Wednesday Midweek Service 6:00 PM
  const wedMorning = Date.parse('2026-11-25T10:00:00+01:00');
  const wedNext = resolveNextService([], DEFAULT_TPC_SCHEDULES, wedMorning);
  assert.ok(wedNext);
  assert.equal(wedNext.title, 'Wednesday Midweek Service');
  assert.equal(wedNext.serviceDate, '2026-11-25');

  // Saturday morning -> Sunday Workers Prayer Meeting at 8:30 AM
  const satMorning = Date.parse('2026-11-28T10:00:00+01:00');
  const sunWorkers = resolveNextService([], DEFAULT_TPC_SCHEDULES, satMorning);
  assert.ok(sunWorkers);
  assert.equal(sunWorkers.title, 'Workers Prayer Meeting');
  assert.equal(sunWorkers.serviceDate, '2026-11-29');
  assert.equal(sunWorkers.startTime, '08:30:00');

  // Sunday 09:45 WAT (after Workers Prayer check-in closed at 09:30) -> Sunday Worship Service 9:00 AM
  const sunDuringWorship = Date.parse('2026-11-29T09:45:00+01:00');
  const sunWorship = resolveNextService(
    [],
    DEFAULT_TPC_SCHEDULES,
    sunDuringWorship,
  );
  assert.ok(sunWorship);
  assert.equal(sunWorship.title, 'Sunday Worship Service');
  assert.equal(sunWorship.serviceDate, '2026-11-29');
});
