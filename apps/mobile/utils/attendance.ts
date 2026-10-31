// ===============================================================
// apps/mobile/utils/attendance.ts
// Pure attendance-preview rules. Device timestamps are evidence,
// not trusted proof of presence. Production decisions belong on the server.
// Window checks and duplicate prevention use O(1) time and space.
// ===============================================================

export const DEMO_SERVICE_PASS = 'TPC-DEMO-WORSHIP-SERVICE-001';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type DemoService = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
};

export type LocationEvidence = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  observedAt: string;
};

export type AttendanceAttempt = {
  serviceId: string;
  serviceName: string;
  scannedAt: string;
  uploadDeadlineAt: string;
  source: 'qr' | 'manualDemo';
  state:
    | 'queued'
    | 'awaitingWitness'
    | 'witnessRequested'
    | 'syncError'
    | 'confirmed'
    | 'rejected'
    | 'expired';
  location: LocationEvidence | null;
};

// ===============================================================
// SAMPLE SERVICE SCHEDULE
// ===============================================================

export function createDemoService(now = Date.now()): DemoService {
  return {
    id: `demo-service-${now}`,
    name: 'Worship Service',
    startsAt: new Date(now - 15 * MINUTE).toISOString(),
    endsAt: new Date(now + 90 * MINUTE).toISOString(),
  };
}

// ===============================================================
// CHECK-IN WINDOW AND UPLOAD DEADLINE
// ===============================================================

export function getAttendanceWindow(service: DemoService) {
  const start = Date.parse(service.startsAt);
  const end = Date.parse(service.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return null;

  return {
    opensAt: start - 30 * MINUTE,
    closesAt: end + 30 * MINUTE,
    uploadDeadlineAt: end + DAY,
  };
}

export function getCheckInState(service: DemoService, now = Date.now()) {
  const window = getAttendanceWindow(service);
  if (!window || !Number.isFinite(now)) return 'unavailable';
  if (now < window.opensAt) return 'notOpen';
  if (now > window.closesAt) return 'closed';
  return 'open';
}

export function isWithinUploadDeadline(service: DemoService, now = Date.now()) {
  const window = getAttendanceWindow(service);
  return (
    window !== null && Number.isFinite(now) && now <= window.uploadDeadlineAt
  );
}

// ===============================================================
// DEMO PASS AND LOCATION VALIDATION
// ===============================================================

export function isDemoServicePass(value: string) {
  return value.length <= 256 && value.trim() === DEMO_SERVICE_PASS;
}

export function isValidLocationEvidence(value: LocationEvidence) {
  return (
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180 &&
    (value.accuracy === null ||
      (Number.isFinite(value.accuracy) && value.accuracy >= 0)) &&
    Number.isFinite(Date.parse(value.observedAt))
  );
}

// ===============================================================
// DUPLICATE SCAN PROTECTION
// ===============================================================

export function retainFirstAttempt(
  current: AttendanceAttempt | null,
  next: AttendanceAttempt,
) {
  return current?.serviceId === next.serviceId ? current : next;
}

// ===============================================================
// ATTENDANCE DISPLAY TIMES IN WAT
// ===============================================================

export function formatAttendanceTime(value: string | number) {
  return new Date(value).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

export function formatAttendanceStamp(value: string | number) {
  return new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}
