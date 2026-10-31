// ===============================================================
// apps/mobile/store/demo-workspace.tsx
// Persist bounded device demo preferences and activity.
// ===============================================================

// One bounded device demo workspace, never an authenticated member record.
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { SavedDemoLoadGuard } from '@/utils/demo-lifecycle';
import { readDemo, writeDemo, resetDemo } from '@/services/demo-storage';
import {
  DEFAULT_PREFERENCES,
  applyDemoReturn,
  validDemoPayment,
  uniqueReadIds,
  type Preferences,
  type DemoPayment,
  type PaymentStatus,
} from '@/utils/member-demo';
import { DEMO_MESSAGES } from '@/constants/messages';

// ===============================================================
// BOUNDED DEVICE DEMO MODELS
// ===============================================================

export type Invitation = {
  id: string;
  kind: 'newcomer' | 'sponsorship';
  name: string;
  note: string;
  status: 'prepared' | 'cancelled';
};
type Workspace = {
  preferences: Preferences;
  readIds: string[];
  payments: DemoPayment[];
  invitations: Invitation[];
  roster: 'unanswered' | 'accepted' | 'unavailable' | 'approved' | 'rejected';
};
const initial: Workspace = {
  preferences: DEFAULT_PREFERENCES,
  readIds: [],
  payments: [],
  invitations: [],
  roster: 'unanswered',
};

// ===============================================================
// SAVED WORKSPACE VALIDATION
// ===============================================================

function restore(value: unknown): Workspace {
  if (value === null) return initial;
  if (!value || typeof value !== 'object') throw new Error('Invalid workspace');
  const p = value as Workspace;
  if (
    !p.preferences ||
    Object.keys(DEFAULT_PREFERENCES).some(
      (k) => typeof p.preferences[k as keyof Preferences] !== 'boolean',
    ) ||
    !Array.isArray(p.payments) ||
    p.payments.length > 50 ||
    !p.payments.every(validDemoPayment) ||
    !Array.isArray(p.invitations) ||
    p.invitations.length > 30 ||
    !p.invitations.every(
      (i) =>
        i &&
        typeof i.id === 'string' &&
        ['newcomer', 'sponsorship'].includes(i.kind) &&
        typeof i.name === 'string' &&
        i.name.length <= 100 &&
        typeof i.note === 'string' &&
        i.note.length <= 500 &&
        ['prepared', 'cancelled'].includes(i.status),
    ) ||
    !['unanswered', 'accepted', 'unavailable', 'approved', 'rejected'].includes(
      p.roster,
    )
  )
    throw new Error('Invalid workspace');
  return {
    ...p,
    readIds: uniqueReadIds(
      p.readIds,
      DEMO_MESSAGES.map((m) => m.id),
    ),
  };
}
type ContextValue = {
  data: Workspace;
  ready: boolean;
  canReset: boolean;
  retryLoad: () => void;
  error: string;
  busy: boolean;
  commit: (update: (value: Workspace) => Workspace) => Promise<boolean>;
  startPayment: (payment: DemoPayment) => Promise<boolean>;
  applyReturn: (reference: string, status: PaymentStatus) => Promise<boolean>;
  reset: () => Promise<boolean>;
};
const Context = createContext<ContextValue | null>(null);

// ===============================================================
// WORKSPACE HYDRATION AND PROVIDER
// ===============================================================

export function DemoWorkspaceProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<Workspace>(initial);
  const latest = useRef(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const loadGuard = useRef(new SavedDemoLoadGuard());
  const [loadSettled, setLoadSettled] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadGuard.current.start();
    setReady(false);
    setLoadSettled(false);
    setError('');
    readDemo('workspace')
      .then((value) => {
        const restored = restore(value);
        if (!active) return;
        latest.current = restored;
        setData(restored);
        loadGuard.current.succeed();
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        loadGuard.current.fail();
        setError(
          'Saved demo data could not be loaded. Retry loading or explicitly reset it in Settings. Saves are blocked to protect existing records.',
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
    if (locked.current || !loadSettled) return;
    loadGuard.current.start();
    setReady(false);
    setLoadSettled(false);
    setLoadAttempt((value) => value + 1);
  }

  // ===============================================================
  // SAVE BEFORE REPORTING A DEMO CHANGE
  // ===============================================================

  async function commit(update: (value: Workspace) => Workspace) {
    if (!ready || !loadGuard.current.canWrite || locked.current || !__DEV__)
      return false;
    locked.current = true;
    setBusy(true);
    try {
      const next = restore(update(latest.current));
      await writeDemo('workspace', next);
      latest.current = next;
      setData(next);
      setError('');
      return true;
    } catch {
      setError(
        'Demo changes could not be saved. Retry or reset demo records in Settings.',
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  // ===============================================================
  // EXPLICIT RESET MAY RECOVER A FAILED LOAD WITHOUT NORMAL WRITES
  // ===============================================================

  async function reset() {
    if (!loadGuard.current.canReset || locked.current || !__DEV__) return false;
    locked.current = true;
    setBusy(true);
    try {
      await resetDemo('workspace', initial);
      latest.current = initial;
      setData(initial);
      loadGuard.current.succeed();
      setReady(true);
      setError('');
      return true;
    } catch {
      setError('Demo workspace reset failed. Check device storage and retry.');
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        ready,
        canReset: loadSettled,
        retryLoad,
        error,
        busy,
        commit,
        startPayment: (p) =>
          commit((v) => {
            if (
              !validDemoPayment(p) ||
              v.payments.length >= 50 ||
              v.payments.some((r) => r.reference === p.reference)
            )
              throw new Error('Invalid demo checkout');
            return { ...v, payments: [p, ...v.payments] };
          }),
        applyReturn: (reference, status) =>
          commit((v) => {
            if (!v.payments.some((p) => p.reference === reference))
              throw new Error('Unknown demo reference');
            return {
              ...v,
              payments: applyDemoReturn(v.payments, reference, status),
            };
          }),
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}

// ===============================================================
// SHARED DEMO WORKSPACE HOOK
// ===============================================================

export function useDemoWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('DemoWorkspaceProvider required.');
  return value;
}
