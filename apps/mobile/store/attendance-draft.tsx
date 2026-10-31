// ===============================================================
// apps/mobile/store/attendance-draft.tsx
// Retain demo evidence and guarded queue transitions.
// ===============================================================

// Persist a bounded demo queue. No background upload or server confirmation occurs.
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { useMemberDraft } from '@/store/member-draft';
import { SavedDemoLoadGuard } from '@/utils/demo-lifecycle';
import { readDemo, writeDemo, resetDemo } from '@/services/demo-storage';
import {
  createDemoService,
  getAttendanceWindow,
  getCheckInState,
  isValidLocationEvidence,
  isWithinUploadDeadline,
  type AttendanceAttempt,
  type DemoService,
  type LocationEvidence,
} from '@/utils/attendance';
import { transitionQueue, type Witness } from '@/utils/member-demo';

// ===============================================================
// PERSISTED ATTENDANCE DEMO MODEL
// ===============================================================

export type AttendanceRecord = AttendanceAttempt & {
  id: string;
  witnessId?: string;
};
type State = { service: DemoService; records: AttendanceRecord[] };
function fresh(): State {
  return { service: createDemoService(), records: [] };
}

// ===============================================================
// SAVED ATTENDANCE VALIDATION
// ===============================================================

function validate(v: unknown): State {
  if (v === null) return fresh();
  if (!v || typeof v !== 'object') throw new Error('Invalid attendance');
  const s = v as State;
  if (
    !s.service ||
    typeof s.service.id !== 'string' ||
    typeof s.service.name !== 'string' ||
    !getAttendanceWindow(s.service) ||
    !Array.isArray(s.records) ||
    s.records.length > 30 ||
    !s.records.every(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        typeof r.serviceId === 'string' &&
        typeof r.serviceName === 'string' &&
        Number.isFinite(Date.parse(r.scannedAt)) &&
        Number.isFinite(Date.parse(r.uploadDeadlineAt)) &&
        ['qr', 'manualDemo'].includes(r.source) &&
        [
          'queued',
          'awaitingWitness',
          'witnessRequested',
          'syncError',
          'confirmed',
          'rejected',
          'expired',
        ].includes(r.state) &&
        (r.location === null || isValidLocationEvidence(r.location)),
    )
  )
    throw new Error('Invalid attendance');
  return s;
}
type Result = { ok: true } | { ok: false; message: string };
type Value = {
  service: DemoService;
  attempt: AttendanceRecord | null;
  records: AttendanceRecord[];
  ready: boolean;
  canReset: boolean;
  retryLoad: () => void;
  busy: boolean;
  error: string;
  saveEvidence: (e: {
    scannedAt: string;
    source: AttendanceAttempt['source'];
    location: LocationEvidence | null;
  }) => Promise<Result>;
  clearEvidence: () => void;
  resetHistory: () => Promise<void>;
  newService: () => Promise<boolean>;
  change: (
    id: string,
    state: AttendanceRecord['state'],
    witness?: Witness,
  ) => Promise<boolean>;
};
const Context = createContext<Value | null>(null);

// ===============================================================
// ATTENDANCE HYDRATION AND PROVIDER
// ===============================================================

export function AttendanceDraftProvider({ children }: PropsWithChildren) {
  const { demoAccess } = useMemberDraft();
  const [data, setData] = useState<State>(fresh);
  const latest = useRef(data);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const loadGuard = useRef(new SavedDemoLoadGuard());
  const [loadSettled, setLoadSettled] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const access = useRef(demoAccess);
  access.current = demoAccess;
  useEffect(() => {
    let active = true;
    loadGuard.current.start();
    setReady(false);
    setLoadSettled(false);
    setError('');
    readDemo('attendance')
      .then((value) => {
        const next = validate(value);
        if (!active) return;
        latest.current = next;
        setData(next);
        loadGuard.current.succeed();
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        loadGuard.current.fail();
        setError(
          'Saved attendance could not be loaded. Retry loading or explicitly reset demo data in Settings. New saves are blocked to protect the queue.',
        );
      })
      .finally(() => {
        if (active) setLoadSettled(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  function retryLoad() {
    if (lock.current || !loadSettled) return;
    loadGuard.current.start();
    setReady(false);
    setLoadSettled(false);
    setLoadAttempt((value) => value + 1);
  }

  // ===============================================================
  // PERSIST EVIDENCE WITH THE WEB GPS EXCLUSION
  // ===============================================================

  async function commit(update: (s: State) => State) {
    if (!ready || !loadGuard.current.canWrite || lock.current || !__DEV__)
      return false;
    lock.current = true;
    setBusy(true);
    try {
      const next = validate(update(latest.current));
      const saved =
        Platform.OS === 'web'
          ? {
              ...next,
              records: next.records.map((r) => ({
                ...r,
                location: null,
                ...(r.location && ['queued', 'syncError'].includes(r.state)
                  ? { state: 'awaitingWitness' as const }
                  : {}),
              })),
            }
          : next;
      await writeDemo('attendance', saved);
      latest.current = next;
      setData(next);
      setError('');
      return true;
    } catch {
      setError(
        'Attendance could not be saved. Try again; the previous saved queue is preserved.',
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  // ===============================================================
  // VALIDATE SCAN EVIDENCE AND PRESERVE THE FIRST ATTEMPT
  // ===============================================================

  async function saveEvidence(e: {
    scannedAt: string;
    source: AttendanceAttempt['source'];
    location: LocationEvidence | null;
  }): Promise<Result> {
    const service = latest.current.service;
    const window = getAttendanceWindow(service);
    const time = Date.parse(e.scannedAt);
    if (!__DEV__ || !access.current || !ready || !window)
      return { ok: false, message: 'Attendance demo is not ready.' };
    if (
      getCheckInState(service, time) !== 'open' ||
      time > Date.now() ||
      !isWithinUploadDeadline(service)
    )
      return {
        ok: false,
        message: 'The check-in or upload window has closed.',
      };
    if (e.location && !isValidLocationEvidence(e.location))
      return {
        ok: false,
        message: 'Location evidence is invalid. Request a witness instead.',
      };
    if (latest.current.records.some((r) => r.serviceId === service.id))
      return { ok: true };
    if (latest.current.records.length >= 30)
      return {
        ok: false,
        message: 'Demo history is full. Reset demo attendance to continue.',
      };
    const record: AttendanceRecord = {
      id: 'ATT-' + Date.now(),
      serviceId: service.id,
      serviceName: service.name,
      scannedAt: e.scannedAt,
      uploadDeadlineAt: new Date(window.uploadDeadlineAt).toISOString(),
      source: e.source,
      location: e.location,
      state: e.location ? 'queued' : 'awaitingWitness',
    };
    const ok = await commit((s) => ({ ...s, records: [record, ...s.records] }));
    return ok
      ? { ok: true }
      : { ok: false, message: 'Evidence was not saved. Please retry.' };
  }

  // ===============================================================
  // GUARDED DEMO QUEUE TRANSITIONS
  // ===============================================================

  async function change(
    id: string,
    state: AttendanceRecord['state'],
    witness?: Witness,
  ) {
    if (!access.current) return false;
    return commit((s) => ({
      ...s,
      records: s.records.map((r) =>
        r.id === id ? transitionQueue(r, state, witness) : r,
      ),
    }));
  }
  // ===============================================================
  // EXPLICIT ATTENDANCE RESET, INCLUDING DAMAGED METADATA RECOVERY
  // ===============================================================

  async function resetHistory() {
    if (!loadGuard.current.canReset || lock.current || !__DEV__)
      throw new Error('Attendance reset is unavailable.');
    lock.current = true;
    setBusy(true);
    try {
      const next = fresh();
      await resetDemo('attendance', next);
      latest.current = next;
      setData(next);
      loadGuard.current.succeed();
      setReady(true);
      setError('');
    } catch (error) {
      setError('Attendance reset failed. Check device storage and retry.');
      throw error;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const attempt =
    data.records.find((r) => r.serviceId === data.service.id) || null;
  return (
    <Context.Provider
      value={{
        service: data.service,
        records: data.records,
        attempt,
        ready,
        canReset: loadSettled,
        retryLoad,
        busy,
        error,
        saveEvidence,
        change,
        clearEvidence: () => {
          void commit((s) => ({
            ...s,
            records: s.records.filter((r) => r.serviceId !== s.service.id),
          }));
        },
        resetHistory,
        newService: () =>
          commit((s) => ({ ...s, service: createDemoService() })),
      }}
    >
      {children}
    </Context.Provider>
  );
}

// ===============================================================
// SHARED ATTENDANCE HOOK
// ===============================================================

export function useAttendanceDraft() {
  const context = useContext(Context);
  if (!context) throw new Error('AttendanceDraftProvider required.');
  return context;
}
