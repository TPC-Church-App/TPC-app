// ===============================================================
// File: apps/mobile/utils/service-schedule.ts
// Description: Pure service schedule resolution, countdowns, and relative time.
// Author: Josiah Ewumi
// ===============================================================

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WAT_OFFSET_MS = 60 * MINUTE_MS; // Africa/Lagos (UTC+01:00, no DST)

export type ServicePeriodType =
  'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'special_period';

export type LiveServiceRecord = {
  id: string;
  title: string;
  description?: string | null;
  service_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM or HH:MM:SS
  end_time: string;
  location?: string | null;
  directions_url?: string | null;
  period_type?: ServicePeriodType | null;
  period_label?: string | null;
  timezone?: string | null;
  qr_code?: string | null;
  is_active: boolean;
};

export type RecurringScheduleRecord = {
  id: string;
  title: string;
  description?: string | null;
  period_type: Exclude<ServicePeriodType, 'one_time'>;
  period_label?: string | null;
  day_of_week: number | null; // 0 = Sun .. 6 = Sat
  day_of_month: number | null; // 1 .. 31
  start_time: string;
  end_time: string;
  effective_from: string; // YYYY-MM-DD
  effective_until?: string | null;
  timezone?: string | null;
  location?: string | null;
  directions_url?: string | null;
  is_active: boolean;
};

export type ResolvedNextService = {
  id: string;
  source: 'dated' | 'recurring';
  title: string;
  description: string | null;
  serviceDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  startsAtMs: number;
  endsAtMs: number;
  checkInOpensAtMs: number;
  checkInClosesAtMs: number;
  location: string;
  directionsUrl: string | null;
  periodType: ServicePeriodType;
  periodLabel: string | null;
  qrCode: string | null;
};

export type ServiceCountdownStatus =
  'check_in_open' | 'live' | 'upcoming' | 'ended';

export type ServiceCountdown = {
  status: ServiceCountdownStatus;
  badgeLabel: string;
  detailLabel: string;
};

// ===============================================================
// DEFAULT TPC RECURRING WEEKLY SCHEDULE
// Used when hosted Supabase has no active service rows yet.
// ===============================================================

export const DEFAULT_TPC_SCHEDULES: RecurringScheduleRecord[] = [
  {
    id: 'default-workers-prayer-sun',
    title: 'Workers Prayer Meeting',
    description: 'Pre-service prayer and preparation for church workers.',
    period_type: 'weekly',
    period_label: 'Every Sunday • 8:30 AM',
    day_of_week: 0,
    day_of_month: null,
    start_time: '08:30:00',
    end_time: '09:00:00',
    effective_from: '2026-01-04',
    effective_until: null,
    timezone: 'Africa/Lagos',
    location: 'Main Auditorium',
    directions_url: null,
    is_active: true,
  },
  {
    id: 'default-sunday-worship',
    title: 'Sunday Worship Service',
    description: 'Come together for worship, prayer and the Word.',
    period_type: 'weekly',
    period_label: 'Every Sunday • 9:00 AM',
    day_of_week: 0,
    day_of_month: null,
    start_time: '09:00:00',
    end_time: '11:30:00',
    effective_from: '2026-01-04',
    effective_until: null,
    timezone: 'Africa/Lagos',
    location: 'Main Auditorium',
    directions_url: null,
    is_active: true,
  },
  {
    id: 'default-wednesday-midweek',
    title: 'Wednesday Midweek Service',
    description: 'Midweek Bible study, prayer and fellowship.',
    period_type: 'weekly',
    period_label: 'Every Wednesday • 6:00 PM',
    day_of_week: 3,
    day_of_month: null,
    start_time: '18:00:00',
    end_time: '19:30:00',
    effective_from: '2026-01-07',
    effective_until: null,
    timezone: 'Africa/Lagos',
    location: 'Main Auditorium',
    directions_url: null,
    is_active: true,
  },
];

// ===============================================================
// DATE & WAT TIME PARSING HELPERS
// ===============================================================

function normalizeTime(value: string): string | null {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/);
  if (!match) return null;
  return `${match[1]}:${match[2]}:${match[3] ?? '00'}`;
}

function parseWatDateTime(dateStr: string, timeStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const normalized = normalizeTime(timeStr);
  if (!normalized) return null;
  const parsed = Date.parse(`${dateStr}T${normalized}+01:00`);
  return Number.isFinite(parsed) ? parsed : null;
}

function getWatYmd(ms: number): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  isoDate: string;
} {
  const shifted = new Date(ms + WAT_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const dayOfWeek = shifted.getUTCDay();
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, dayOfWeek, isoDate };
}

function addDaysIso(isoDate: string, days: number): string {
  const base = Date.parse(`${isoDate}T00:00:00Z`);
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

function buildResolved(params: {
  id: string;
  source: 'dated' | 'recurring';
  title: string;
  description?: string | null;
  serviceDate: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  directionsUrl?: string | null;
  periodType?: ServicePeriodType | null;
  periodLabel?: string | null;
  qrCode?: string | null;
}): ResolvedNextService | null {
  const startsAtMs = parseWatDateTime(params.serviceDate, params.startTime);
  const endsAtMs = parseWatDateTime(params.serviceDate, params.endTime);
  if (startsAtMs === null || endsAtMs === null || endsAtMs <= startsAtMs) {
    return null;
  }

  return {
    id: params.id,
    source: params.source,
    title: params.title,
    description: params.description ?? null,
    serviceDate: params.serviceDate,
    startTime: params.startTime,
    endTime: params.endTime,
    startsAtMs,
    endsAtMs,
    checkInOpensAtMs: startsAtMs - 30 * MINUTE_MS,
    checkInClosesAtMs: endsAtMs + 30 * MINUTE_MS,
    location: params.location?.trim() || 'Main Auditorium',
    directionsUrl: params.directionsUrl?.trim() || null,
    periodType: params.periodType ?? 'one_time',
    periodLabel: params.periodLabel?.trim() || null,
    qrCode: params.qrCode?.trim() || null,
  };
}

// ===============================================================
// RECURRING TEMPLATE NEXT-OCCURRENCE PROJECTION
// ===============================================================

function findNextOccurrenceDate(
  schedule: RecurringScheduleRecord,
  nowMs: number,
): string | null {
  if (!schedule.is_active) return null;
  const todayWat = getWatYmd(nowMs).isoDate;
  const searchStart =
    schedule.effective_from > todayWat ? schedule.effective_from : todayWat;

  if (schedule.effective_until && searchStart > schedule.effective_until) {
    return null;
  }

  if (
    schedule.period_type === 'weekly' ||
    schedule.period_type === 'biweekly'
  ) {
    const targetDow = schedule.day_of_week ?? 0;
    const stepDays = schedule.period_type === 'biweekly' ? 14 : 7;

    // Find first date >= effective_from matching targetDow
    const effMs = Date.parse(`${schedule.effective_from}T00:00:00Z`);
    const effDow = new Date(effMs).getUTCDay();
    const initialOffset = (targetDow - effDow + 7) % 7;
    let candidate = addDaysIso(schedule.effective_from, initialOffset);

    if (candidate < searchStart) {
      const diffDays = Math.ceil(
        (Date.parse(`${searchStart}T00:00:00Z`) -
          Date.parse(`${candidate}T00:00:00Z`)) /
          DAY_MS,
      );
      const jumps = Math.floor(diffDays / stepDays);
      candidate = addDaysIso(candidate, jumps * stepDays);
      if (candidate < searchStart) {
        candidate = addDaysIso(candidate, stepDays);
      }
    }

    // Check if today's occurrence already closed check-in (+30m after end)
    const endMs = parseWatDateTime(candidate, schedule.end_time);
    if (endMs !== null && nowMs > endMs + 30 * MINUTE_MS) {
      candidate = addDaysIso(candidate, stepDays);
    }

    if (schedule.effective_until && candidate > schedule.effective_until) {
      return null;
    }
    return candidate;
  }

  if (schedule.period_type === 'monthly') {
    const targetDay = Math.min(31, Math.max(1, schedule.day_of_month ?? 1));
    const startParts = getWatYmd(Date.parse(`${searchStart}T00:00:00Z`));
    let year = startParts.year;
    let month = startParts.month;

    for (let i = 0; i < 14; i++) {
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const clampedDay = Math.min(targetDay, daysInMonth);
      const candidate = `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
      const endMs = parseWatDateTime(candidate, schedule.end_time);

      if (
        candidate >= searchStart &&
        endMs !== null &&
        nowMs <= endMs + 30 * MINUTE_MS
      ) {
        if (schedule.effective_until && candidate > schedule.effective_until) {
          return null;
        }
        return candidate;
      }

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return null;
  }

  // special_period: daily or targeted window between effective_from and effective_until
  const candidate = searchStart;
  const endMs = parseWatDateTime(candidate, schedule.end_time);
  if (endMs !== null && nowMs > endMs + 30 * MINUTE_MS) {
    const tomorrow = addDaysIso(candidate, 1);
    if (schedule.effective_until && tomorrow > schedule.effective_until) {
      return null;
    }
    return tomorrow;
  }
  return candidate;
}

// ===============================================================
// MERGE DATED SERVICES + RECURRING TEMPLATES
// Dated services override recurring templates on the same date/title.
// ===============================================================

export function resolveNextService(
  services: LiveServiceRecord[],
  schedules: RecurringScheduleRecord[] = [],
  nowMs = Date.now(),
): ResolvedNextService | null {
  const activeDated = services
    .filter((s) => s.is_active)
    .map((s) =>
      buildResolved({
        id: s.id,
        source: 'dated',
        title: s.title,
        description: s.description,
        serviceDate: s.service_date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        directionsUrl: s.directions_url,
        periodType: s.period_type,
        periodLabel: s.period_label,
        qrCode: s.qr_code,
      }),
    )
    .filter(
      (item): item is ResolvedNextService =>
        item !== null && nowMs <= item.checkInClosesAtMs,
    );

  const overrideKeys = new Set(
    activeDated.map((d) => `${d.serviceDate}::${d.title.trim().toLowerCase()}`),
  );

  const recurringResolved = schedules
    .filter((sc) => sc.is_active)
    .map((sc) => {
      const nextDate = findNextOccurrenceDate(sc, nowMs);
      if (!nextDate) return null;
      const key = `${nextDate}::${sc.title.trim().toLowerCase()}`;
      if (overrideKeys.has(key)) return null;

      return buildResolved({
        id: sc.id,
        source: 'recurring',
        title: sc.title,
        description: sc.description,
        serviceDate: nextDate,
        startTime: sc.start_time,
        endTime: sc.end_time,
        location: sc.location,
        directionsUrl: sc.directions_url,
        periodType: sc.period_type,
        periodLabel: sc.period_label,
        qrCode: null,
      });
    })
    .filter(
      (item): item is ResolvedNextService =>
        item !== null && nowMs <= item.checkInClosesAtMs,
    );

  const combined = [...activeDated, ...recurringResolved];
  if (combined.length === 0) return null;

  combined.sort((a, b) => a.startsAtMs - b.startsAtMs);
  return combined[0];
}

// ===============================================================
// LIVE COUNTDOWN & DISPLAY FORMATTING
// ===============================================================

export function getServiceCountdown(
  service: ResolvedNextService,
  nowMs = Date.now(),
): ServiceCountdown {
  if (nowMs > service.checkInClosesAtMs) {
    return {
      status: 'ended',
      badgeLabel: 'Ended',
      detailLabel: 'Service ended',
    };
  }

  if (nowMs >= service.startsAtMs && nowMs <= service.endsAtMs) {
    return {
      status: 'live',
      badgeLabel: 'Live Now',
      detailLabel: 'Service in progress',
    };
  }

  if (nowMs >= service.checkInOpensAtMs) {
    const minsToStart = Math.max(
      0,
      Math.ceil((service.startsAtMs - nowMs) / MINUTE_MS),
    );
    return {
      status: 'check_in_open',
      badgeLabel: 'Check-in Open',
      detailLabel:
        minsToStart > 0 ? `Starts in ${minsToStart}m` : 'Check-in active',
    };
  }

  const diffMs = service.startsAtMs - nowMs;
  const totalMinutes = Math.max(1, Math.ceil(diffMs / MINUTE_MS));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;

  let shortTimer: string;
  if (days >= 1) {
    shortTimer = hours > 0 ? `In ${days}d ${hours}h` : `In ${days}d`;
  } else if (hours >= 1) {
    shortTimer = mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
  } else {
    shortTimer = `In ${mins}m`;
  }

  return {
    status: 'upcoming',
    badgeLabel: shortTimer,
    detailLabel: `Starts ${shortTimer.toLowerCase()}`,
  };
}

export function formatServiceDateTime(service: ResolvedNextService): string {
  const dateObj = new Date(service.startsAtMs);
  const weekday = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: 'Africa/Lagos',
  });
  const day = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    timeZone: 'Africa/Lagos',
  });
  const month = dateObj.toLocaleDateString('en-GB', {
    month: 'short',
    timeZone: 'Africa/Lagos',
  });
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  });

  return `${weekday} ${day} ${month} • ${time}`;
}

export function getGreetingForHour(nowMs = Date.now()): string {
  const watHour = new Date(nowMs + WAT_OFFSET_MS).getUTCHours();
  if (watHour < 12) return 'Good morning,';
  if (watHour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function formatRelativeTime(
  isoDate: string,
  nowMs = Date.now(),
): string {
  const targetMs = Date.parse(isoDate);
  if (!Number.isFinite(targetMs)) return '';
  const diffMs = Math.max(0, nowMs - targetMs);
  const mins = Math.floor(diffMs / MINUTE_MS);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(targetMs).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  });
}
