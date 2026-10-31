// ===============================================================
// apps/mobile/utils/member-demo.ts
// Pure demo rules. Arrays are bounded by the provider; scans use O(n) time
// and O(n) space. No result here grants account or staff permissions.
// ===============================================================

export const PAYMENT_STATUSES = [
  'pending',
  'ongoing',
  'processing',
  'queued',
  'successful',
  'failed',
  'abandoned',
  'reversed',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type DemoPayment = {
  reference: string;
  fundId: string;
  fundName: string;
  category: string;
  amountMinor: number;
  status: PaymentStatus;
  createdAt: string;
};
export type Preferences = {
  announcements: boolean;
  weekly: boolean;
  attendance: boolean;
  payments: boolean;
  departments: boolean;
};
export const DEFAULT_PREFERENCES: Preferences = {
  announcements: true,
  weekly: true,
  attendance: true,
  payments: true,
  departments: true,
};

// ===============================================================
// REQUIRED PROFILE FIELD VALIDATION
// ===============================================================

export function profileError(
  firstName: string,
  surname: string,
  age: string,
): string {
  if (!firstName.trim() || !surname.trim())
    return 'Enter your first name and surname.';
  if (firstName.trim().length > 100 || surname.trim().length > 100)
    return 'Each name must contain at most 100 characters.';
  if (!/^\d{1,3}$/.test(age) || Number(age) < 4)
    return 'Enter a whole-number age of 4 or above.';
  return '';
}

// ===============================================================
// DEMO PAYMENT STATUS AND RECORD VALIDATION
// ===============================================================

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}
export function validDemoPayment(value: unknown): value is DemoPayment {
  if (!value || typeof value !== 'object') return false;
  const p = value as DemoPayment;
  return (
    typeof p.reference === 'string' &&
    /^DEMO-[a-zA-Z0-9-]{1,80}$/.test(p.reference) &&
    typeof p.fundId === 'string' &&
    p.fundId.startsWith('demo-') &&
    p.fundId.length <= 100 &&
    typeof p.fundName === 'string' &&
    p.fundName.length <= 100 &&
    ['offering', 'tithe', 'property', 'general', 'program'].includes(
      p.category,
    ) &&
    Number.isSafeInteger(p.amountMinor) &&
    p.amountMinor >= 10000 &&
    p.amountMinor <= 100000000 &&
    isPaymentStatus(p.status) &&
    typeof p.createdAt === 'string' &&
    p.createdAt.length <= 64 &&
    Number.isFinite(Date.parse(p.createdAt))
  );
}
// A callback can change only a locally created demo reference. Replays
// cannot upgrade failed/abandoned/reversed records or undo success.

// ===============================================================
// OWNED REFERENCE AND REPLAY RULES
// ===============================================================

export function applyDemoReturn(
  records: DemoPayment[],
  reference: string,
  status: PaymentStatus,
): DemoPayment[] {
  return records.map((p) => {
    if (p.reference !== reference || !validDemoPayment(p)) return p;
    if (p.status === status) return p;
    if (p.status === 'successful')
      return status === 'reversed' ? { ...p, status } : p;
    if (['failed', 'abandoned', 'reversed'].includes(p.status)) return p;
    return { ...p, status };
  });
}
export function receiptAvailable(payment: DemoPayment | undefined): boolean {
  return (
    !!payment && validDemoPayment(payment) && payment.status === 'successful'
  );
}

// ===============================================================
// ELIGIBLE MEMBER WITNESS MODEL
// ===============================================================

export type Witness = {
  id: string;
  name: string;
  verified: boolean;
  confirmedServiceId: string;
};
export function eligibleWitness(
  witness: Witness,
  serviceId: string,
  requesterId: string,
): boolean {
  return (
    witness.verified &&
    witness.confirmedServiceId === serviceId &&
    witness.id !== requesterId
  );
}

// ===============================================================
// OFFLINE UPLOAD EXPIRY
// ===============================================================

export function queueExpired(deadline: string, now = Date.now()): boolean {
  const time = Date.parse(deadline);
  return !Number.isFinite(time) || now > time;
}
export type QueueState =
  | 'queued'
  | 'awaitingWitness'
  | 'witnessRequested'
  | 'syncError'
  | 'confirmed'
  | 'rejected'
  | 'expired';
type QueueItem = {
  state: QueueState;
  serviceId: string;
  uploadDeadlineAt: string;
  witnessId?: string;
};
// O(1) transition: terminal results and the upload deadline cannot be bypassed.

// ===============================================================
// GUARDED ATTENDANCE STATE TRANSITIONS
// ===============================================================

export function transitionQueue<T extends QueueItem>(
  record: T,
  state: QueueState,
  witness?: Witness,
  now = Date.now(),
): T {
  if (['confirmed', 'rejected', 'expired'].includes(record.state))
    return record;
  if (queueExpired(record.uploadDeadlineAt, now))
    return { ...record, state: 'expired' };
  if (state === 'witnessRequested' && record.state === 'awaitingWitness')
    return { ...record, state };
  if (
    state === 'queued' &&
    record.state === 'witnessRequested' &&
    witness &&
    eligibleWitness(witness, record.serviceId, 'demo-self')
  )
    return { ...record, state, witnessId: witness.id };
  if (state === 'queued' && record.state === 'syncError')
    return { ...record, state };
  if (
    ['confirmed', 'rejected', 'syncError'].includes(state) &&
    ['queued', 'syncError'].includes(record.state)
  )
    return { ...record, state };
  return record;
}

// ===============================================================
// BOUNDED MESSAGE READ STATE
// ===============================================================

export function uniqueReadIds(
  ids: unknown,
  allowed: readonly string[],
): string[] {
  return Array.isArray(ids)
    ? [
        ...new Set(
          ids.filter(
            (id): id is string =>
              typeof id === 'string' && allowed.includes(id),
          ),
        ),
      ].slice(0, 100)
    : [];
}
