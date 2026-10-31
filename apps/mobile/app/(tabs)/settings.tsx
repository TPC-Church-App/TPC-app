// ===============================================================
// apps/mobile/app/(tabs)/settings.tsx
// Configure saved demo preferences and reset controls.
// ===============================================================

import { useRef, useState } from 'react';
import { Text, View, Switch } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import DemoStatus from '@/components/demo-status';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { useMemberDraft } from '@/store/member-draft';
import { useAttendanceDraft } from '@/store/attendance-draft';
import { DEFAULT_PREFERENCES, type Preferences } from '@/utils/member-demo';
import { colors } from '@/constants/theme';
const labels: Record<keyof Preferences, string> = {
  announcements: 'Church announcements',
  weekly: 'Weekly church messages',
  attendance: 'Attendance reminders',
  payments: 'Payment updates',
  departments: 'Department updates',
};

// ===============================================================
// PREFERENCES AND RESET STATE
// ===============================================================

export default function SettingsScreen() {
  const { data, commit, ready, busy, reset, canReset } = useDemoWorkspace();
  const profile = useMemberDraft();
  const { clearSavedProfile } = profile;
  const attendance = useAttendanceDraft();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const [resetting, setResetting] = useState(false);
  const resetLock = useRef(false);
  const [resetError, setResetError] = useState('');

  // ===============================================================
  // EXPLICIT DEMO DATA RESET
  // ===============================================================

  async function clear() {
    if (resetLock.current) return;
    resetLock.current = true;
    setResetting(true);
    setResetError('');
    try {
      const ok = await reset();
      if (!ok) throw new Error('Workspace reset failed');
      await clearSavedProfile();
      await attendance.resetHistory();
      setNotice('Saved demo records cleared.');
      setConfirm(false);
    } catch {
      setResetError(
        'Some demo data could not be cleared. Check device storage and retry.',
      );
    } finally {
      resetLock.current = false;
      setResetting(false);
    }
  }

  // ===============================================================
  // SETTINGS AND RESET CONFIRMATION INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Settings"
      subtitle="Make this demo feel like your church home."
      sectionLabel="PREFERENCES"
    >
      <DemoStatus />
      {(attendance.error || profile.storageError) && (
        <View style={ui.card}>
          <Text style={ui.heading}>Saved data recovery</Text>
          {!!attendance.error && (
            <>
              <Text accessibilityRole="alert" style={ui.error}>
                {attendance.error}
              </Text>
              <GivingButton
                label="Retry loading attendance"
                secondary
                disabled={!attendance.canReset || attendance.busy || resetting}
                onPress={attendance.retryLoad}
              />
            </>
          )}
          {!!profile.storageError && (
            <>
              <Text accessibilityRole="alert" style={ui.error}>
                {profile.storageError}
              </Text>
              <GivingButton
                label="Retry loading saved profile"
                secondary
                disabled={!profile.canReset || profile.busy || resetting}
                onPress={profile.retryLoad}
              />
            </>
          )}
          <Text style={ui.caption}>
            Retry keeps saved data. Reset below deliberately clears this
            device's demo data.
          </Text>
        </View>
      )}
      <View style={ui.card}>
        <Text style={ui.heading}>Notification preferences</Text>
        <Text style={ui.body}>
          These switches filter the demo notification inbox. Push delivery and
          device permissions are not connected.
        </Text>
        {(Object.keys(labels) as (keyof Preferences)[]).map((key) => (
          <View key={key} style={ui.row}>
            <Text style={[ui.label, { flex: 1 }]}>{labels[key]}</Text>
            <Switch
              accessibilityLabel={labels[key]}
              disabled={!ready || busy}
              value={data.preferences[key]}
              trackColor={{ true: colors.link }}
              onValueChange={(value) => {
                void commit((p) => ({
                  ...p,
                  preferences: { ...p.preferences, [key]: value },
                }));
              }}
            />
          </View>
        ))}
        <GivingButton
          label="Restore default preferences"
          secondary
          disabled={!ready || busy}
          onPress={() => {
            void commit((p) => ({ ...p, preferences: DEFAULT_PREFERENCES }));
          }}
        />
      </View>
      <View style={ui.card}>
        <Text style={ui.heading}>Accessibility</Text>
        <Text style={ui.body}>
          Animation follows your device’s Reduce Motion setting. Text follows
          your system font size. Camera and location are requested only when
          needed for check-in.
        </Text>
      </View>
      <View style={ui.card}>
        <Text style={ui.heading}>Demo data</Text>
        <Text style={ui.body}>
          Saved data belongs to this device demo, not an authenticated person.
          Avoid using private information on a shared device. Reset clears the
          saved profile, attendance evidence, payment demos and preferences. No
          live account is deleted.
        </Text>
        <GivingButton
          label="Reset saved demo data"
          secondary
          disabled={
            !canReset ||
            busy ||
            resetting ||
            !attendance.canReset ||
            attendance.busy ||
            !profile.canReset ||
            profile.busy
          }
          onPress={() => {
            setResetError('');
            setConfirm(true);
          }}
        />
      </View>
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {notice}
        </Text>
      )}
      <GivingSheet
        title="Clear saved demo data?"
        visible={confirm}
        onClose={() => {
          if (!resetting) setConfirm(false);
        }}
      >
        <Text style={ui.body}>
          This removes the saved demo records from this app. App-created profile
          photos are also removed. This cannot undo shared screenshots or delete
          a real church account.
        </Text>
        {!!resetError && (
          <Text accessibilityRole="alert" style={ui.error}>
            {resetError}
          </Text>
        )}
        <GivingButton
          label={resetting ? 'Clearing…' : 'Clear demo data'}
          disabled={resetting}
          onPress={clear}
        />
        <GivingButton
          label="Keep demo data"
          secondary
          disabled={resetting}
          onPress={() => setConfirm(false)}
        />
      </GivingSheet>
    </GivingPage>
  );
}
