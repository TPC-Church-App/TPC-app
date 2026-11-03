// ===============================================================
// supabase/functions/_shared/attendance-window.ts
// Apply the church's WAT check-in window on the trusted server.
// ===============================================================

const MINUTE_MS = 60_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/;

export type ServiceSchedule = {
  service_date: string;
  start_time: string;
  end_time: string;
};

export type CheckInWindow = {
  opensAt: number;
  closesAt: number;
};

// ===============================================================
// BUILD THE ALLOWED CHECK-IN WINDOW
// Church schedule times use Africa/Lagos time (WAT, UTC+01:00).
// ===============================================================

export function getCheckInWindow(
  schedule: ServiceSchedule,
): CheckInWindow | null {
  if (
    !DATE_PATTERN.test(schedule.service_date) ||
    !TIME_PATTERN.test(schedule.start_time) ||
    !TIME_PATTERN.test(schedule.end_time)
  ) {
    return null;
  }

  const dateStart = Date.parse(`${schedule.service_date}T00:00:00Z`);
  if (
    !Number.isFinite(dateStart) ||
    new Date(dateStart).toISOString().slice(0, 10) !== schedule.service_date
  ) {
    return null;
  }

  // Postgres TIME may include microseconds; JavaScript date parsing only
  // needs milliseconds, so normalize without changing the scheduled instant.
  const startTime = normalizeSqlTime(schedule.start_time);
  const endTime = normalizeSqlTime(schedule.end_time);
  const start = Date.parse(`${schedule.service_date}T${startTime}+01:00`);
  const end = Date.parse(`${schedule.service_date}T${endTime}+01:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  return {
    opensAt: start - 30 * MINUTE_MS,
    closesAt: end + 30 * MINUTE_MS,
  };
}

// ===============================================================
// NORMALIZE POSTGRES TIME VALUES FOR THE RUNTIME DATE PARSER
// ===============================================================

function normalizeSqlTime(value: string): string {
  const [clock, fraction] = value.split('.');
  const seconds = clock.length === 5 ? `${clock}:00` : clock;
  const milliseconds = fraction
    ? `.${fraction.slice(0, 3).padEnd(3, '0')}`
    : '';

  return `${seconds}${milliseconds}`;
}

// ===============================================================
// TEST WHETHER A CHECK-IN IS OPEN
// Both boundary instants are allowed to match the mobile preview.
// ===============================================================

export function isCheckInOpen(
  schedule: ServiceSchedule,
  now = Date.now(),
): boolean {
  const window = getCheckInWindow(schedule);
  return (
    window !== null &&
    Number.isFinite(now) &&
    now >= window.opensAt &&
    now <= window.closesAt
  );
}
