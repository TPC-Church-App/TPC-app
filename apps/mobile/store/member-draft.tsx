// ===============================================================
// apps/mobile/store/member-draft.tsx
// Keep explicit demo identity separate from real authentication.
// ===============================================================

import { clearDemoPhotos } from '@/services/demo-photos';
import { Platform } from 'react-native';
// Local demo identity is explicitly saved/loaded; a phone/email is not an account lookup.
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
import { profileError } from '@/utils/member-demo';

// ===============================================================
// LOCAL PROFILE MODEL
// ===============================================================

export type MemberDraft = {
  departmentRequest: {
    department: string;
    status: 'demoPending' | 'demoApproved' | 'demoRejected';
  } | null;
  photoUri: string | null;
  firstName: string;
  surname: string;
  age: string;
  attendance: '' | 'regular' | 'visiting' | 'firstVisit';
};
const empty: MemberDraft = {
  firstName: '',
  surname: '',
  age: '',
  attendance: '',
  photoUri: null,
  departmentRequest: null,
};

// ===============================================================
// SAVED PROFILE VALIDATION
// ===============================================================

function validProfile(value: unknown): value is MemberDraft {
  if (!value || typeof value !== 'object') return false;
  const p = value as MemberDraft;
  return (
    typeof p.firstName === 'string' &&
    typeof p.surname === 'string' &&
    typeof p.age === 'string' &&
    !profileError(p.firstName, p.surname, p.age) &&
    ['', 'regular', 'visiting', 'firstVisit'].includes(p.attendance) &&
    (p.photoUri === null ||
      (typeof p.photoUri === 'string' &&
        p.photoUri.length < 2000 &&
        ['file:', 'blob:', 'data:image/'].some((prefix) =>
          p.photoUri?.startsWith(prefix),
        ))) &&
    (p.departmentRequest === null ||
      (typeof p.departmentRequest?.department === 'string' &&
        p.departmentRequest.department.trim().length > 0 &&
        p.departmentRequest.department.length <= 100 &&
        ['demoPending', 'demoApproved', 'demoRejected'].includes(
          p.departmentRequest.status,
        )))
  );
}
type Value = {
  draft: MemberDraft;
  updateDraft: (changes: Partial<MemberDraft>) => void;
  entryMode: 'register' | 'signIn';
  setEntryMode: (mode: 'register' | 'signIn') => void;
  demoAccess: boolean;
  openDemo: () => void;
  closeDemo: () => void;
  ready: boolean;
  busy: boolean;
  canReset: boolean;
  retryLoad: () => void;
  storageError: string;
  savedProfile: MemberDraft | null;
  saveProfile: () => Promise<boolean>;
  loadSavedProfile: () => void;
  clearSavedProfile: () => Promise<void>;
  sessionToken: () => number;
  isCurrentSession: (token: number) => boolean;
};
const Context = createContext<Value | null>(null);

// ===============================================================
// DRAFT, SAVED PROFILE AND DEMO ACCESS PROVIDER
// ===============================================================

export function MemberDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<MemberDraft>(empty);
  const [entryMode, updateMode] = useState<'register' | 'signIn'>('register');
  const [demoAccess, setAccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setError] = useState('');
  const [savedProfile, setSaved] = useState<MemberDraft | null>(null);
  const epoch = useRef(0);
  const lock = useRef(false);
  const loadGuard = useRef(new SavedDemoLoadGuard());
  const [busy, setBusy] = useState(false);
  const [loadSettled, setLoadSettled] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadGuard.current.start();
    setReady(false);
    setLoadSettled(false);
    setError('');
    readDemo('profile')
      .then((value) => {
        if (value !== null && !validProfile(value))
          throw new Error('Invalid profile');
        if (!active) return;
        setSaved(value as MemberDraft | null);
        loadGuard.current.succeed();
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        loadGuard.current.fail();
        setError(
          'Saved profile could not be loaded. Retry loading or explicitly reset demo data in Settings. Saves are blocked to protect existing details.',
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
  function setEntryMode(mode: 'register' | 'signIn') {
    epoch.current++;
    updateMode(mode);
    setAccess(false);
    setDraft(empty);
  }
  function closeDemo() {
    epoch.current++;
    setAccess(false);
    setDraft(empty);
  }

  // ===============================================================
  // EXPLICIT PROFILE PERSISTENCE
  // ===============================================================

  async function saveProfile() {
    if (!ready || !loadGuard.current.canWrite || lock.current || !__DEV__)
      return false;
    const error = profileError(draft.firstName, draft.surname, draft.age);
    if (error) {
      setError(error);
      return false;
    }
    const token = epoch.current;
    lock.current = true;
    setBusy(true);
    try {
      const saved = {
        ...draft,
        photoUri: Platform.OS === 'web' ? null : draft.photoUri,
      };
      await writeDemo('profile', saved);
      setSaved(saved);
      if (token === epoch.current) setError('');
      return true;
    } catch {
      if (token === epoch.current)
        setError(
          'Profile could not be saved. Free device storage and try again.',
        );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  // ===============================================================
  // RESET SAVED PROFILE AND APP-CREATED PHOTOS
  // ===============================================================

  async function clearSavedProfile() {
    if (!loadGuard.current.canReset || lock.current || !__DEV__)
      throw new Error('Profile reset is unavailable.');
    lock.current = true;
    setBusy(true);
    epoch.current++;
    try {
      await resetDemo('profile', null);
      setSaved(null);
      setDraft(empty);
      loadGuard.current.succeed();
      setReady(true);
      setError('');
      clearDemoPhotos();
    } catch (error) {
      setError(
        'Profile or photo reset failed. Check device storage and retry.',
      );
      throw error;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Context.Provider
      value={{
        draft,
        updateDraft: (changes) => setDraft((p) => ({ ...p, ...changes })),
        entryMode,
        setEntryMode,
        demoAccess,
        openDemo: () => {
          if (__DEV__) setAccess(true);
        },
        closeDemo,
        ready,
        busy,
        canReset: loadSettled,
        retryLoad,
        storageError,
        savedProfile,
        saveProfile,
        loadSavedProfile: () => {
          if (ready && !busy && savedProfile) {
            setDraft(savedProfile);
            updateMode('register');
          }
        },
        clearSavedProfile,
        sessionToken: () => epoch.current,
        isCurrentSession: (token) => token === epoch.current,
      }}
    >
      {children}
    </Context.Provider>
  );
}

// ===============================================================
// SHARED MEMBER DRAFT HOOK
// ===============================================================

export function useMemberDraft() {
  const value = useContext(Context);
  if (!value) throw new Error('MemberDraftProvider required.');
  return value;
}
