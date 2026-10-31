// ===============================================================
// apps/mobile/app/(tabs)/attendance.tsx
// Show demo service, history, witness and offline states.
// ===============================================================

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Image, Platform, Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import BrandedLoader from '@/components/branded-loader';
import {
  useAttendanceDraft,
  type AttendanceRecord,
} from '@/store/attendance-draft';
import {
  formatAttendanceStamp,
  getAttendanceWindow,
  getCheckInState,
} from '@/utils/attendance';
import {
  eligibleWitness,
  queueExpired,
  type Witness,
} from '@/utils/member-demo';
const labels: Record<AttendanceRecord['state'], string> = {
  queued: 'Queued for demo sync',
  awaitingWitness: 'Witness needed',
  witnessRequested: 'Witness request prepared',
  syncError: 'Sync failed · Retry available',
  confirmed: 'Confirmed (demo)',
  rejected: 'Rejected (demo)',
  expired: 'Upload deadline expired',
};

// ===============================================================
// SERVICE, HISTORY AND QUEUE STATE
// ===============================================================

export default function AttendanceScreen() {
  const {
    service,
    attempt,
    records,
    ready,
    busy,
    error,
    change,
    newService,
    canReset,
    retryLoad,
  } = useAttendanceDraft();
  const [qr, setQr] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loader, setLoader] = useState(false);
  const [notice, setNotice] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [resultId, setResultId] = useState('');
  const record = records.find((r) => r.id === selected);
  const window = getAttendanceWindow(service);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  function state(r: AttendanceRecord) {
    return !['confirmed', 'rejected'].includes(r.state) &&
      queueExpired(r.uploadDeadlineAt, now)
      ? 'expired'
      : r.state;
  }

  // ===============================================================
  // DEMO SYNC OUTCOMES
  // ===============================================================

  async function sync(result: 'confirmed' | 'rejected' | 'syncError') {
    if (!record) return;
    setSyncing(true);
    setResultId(record.id);
    setLoader(true);
    const ok = await change(record.id, result);
    setNotice(
      ok
        ? result === 'confirmed'
          ? 'Demo result saved. No real attendance was verified.'
          : result === 'rejected'
            ? 'Demo rejection saved. No real attendance decision was made.'
            : 'Demo connection failure saved. Your evidence remains in the queue.'
        : 'Could not save the demo result. Retry.',
    );
    setSyncing(false);
  }
  const witnesses: Witness[] = record
    ? [
        {
          id: 'demo-member-anna',
          name: 'Anna · verified, present at this service (sample)',
          verified: true,
          confirmedServiceId: record.serviceId,
        },
        {
          id: 'demo-member-other',
          name: 'Member at another service (ineligible)',
          verified: true,
          confirmedServiceId: 'other-service',
        },
        {
          id: 'demo-unverified',
          name: 'Unverified visitor (ineligible)',
          verified: false,
          confirmedServiceId: record.serviceId,
        },
      ]
    : [];

  // ===============================================================
  // ATTENDANCE AND WITNESS INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Attendance & check-in"
      subtitle="Be part of the gathering. Every result on this page is a demo."
      sectionLabel="ATTENDANCE"
    >
      {!ready && !error && (
        <Text style={ui.body}>Loading saved attendance…</Text>
      )}
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
          <GivingButton
            label="Retry loading attendance"
            secondary
            disabled={!canReset || busy}
            onPress={retryLoad}
          />
        </>
      )}
      <View style={[ui.card, ui.hero]}>
        <Text style={ui.heading}>{service.name}</Text>
        <Text style={ui.heroBody}>
          Sample service · {formatAttendanceStamp(service.startsAt)} WAT
        </Text>
        <Text style={ui.heroBody}>
          Ends {formatAttendanceStamp(service.endsAt)} WAT
        </Text>
        <Text style={ui.heroBody}>
          {getCheckInState(service, now) === 'open'
            ? 'Check-in open'
            : 'Check-in closed'}
        </Text>
      </View>
      <GivingButton
        label={attempt ? 'View current check-in' : 'Scan service QR code'}
        disabled={
          !ready ||
          busy ||
          (!attempt && getCheckInState(service, now) !== 'open')
        }
        onPress={() =>
          attempt ? setSelected(attempt.id) : router.navigate('/(tabs)/scanner')
        }
      />
      <GivingButton
        label="Show sample service QR"
        secondary
        onPress={() => setQr(true)}
      />
      <View style={ui.card}>
        <Text style={ui.heading}>Check-in window</Text>
        {window && (
          <>
            <Text style={ui.body}>
              Opens: {formatAttendanceStamp(window.opensAt)} WAT
            </Text>
            <Text style={ui.body}>
              Closes: {formatAttendanceStamp(window.closesAt)} WAT
            </Text>
            <Text style={ui.body}>
              Upload by: {formatAttendanceStamp(window.uploadDeadlineAt)} WAT
            </Text>
          </>
        )}
        <Text style={ui.caption}>
          30 minutes before service starts through 30 minutes after it ends.
          Offline evidence has a 24-hour upload limit after service ends.
        </Text>
      </View>
      <Text style={ui.heading}>Attendance history & offline queue</Text>
      <Text style={ui.body}>
        {Platform.OS === 'web'
          ? 'Browser reloads keep sample history but discard GPS coordinates. Unuploaded GPS evidence will require a witness.'
          : 'The native queue survives reloads in encrypted device storage.'}{' '}
        Sync controls simulate server responses; this app does not upload
        evidence.
      </Text>
      {!records.length && (
        <View style={ui.card}>
          <Text style={ui.heading}>Your attendance journey starts here</Text>
          <Text style={ui.body}>
            Scan the sample service QR or use the manual demo code. Location is
            optional. A verified member present at the same service may witness
            your presence.
          </Text>
        </View>
      )}
      {records.map((r) => (
        <View key={r.id} style={ui.card}>
          <Text style={ui.heading}>{r.serviceName}</Text>
          <Text style={ui.label}>{labels[state(r)]}</Text>
          <Text style={ui.body}>{formatAttendanceStamp(r.scannedAt)} WAT</Text>
          <GivingButton
            label="View attendance details"
            secondary
            onPress={() => {
              setSelected(r.id);
              setNotice('');
            }}
          />
        </View>
      ))}
      <GivingButton
        label="Start another sample service"
        secondary
        disabled={!ready || busy}
        onPress={() => {
          void newService();
          setNow(Date.now());
        }}
      />
      <GivingSheet
        title="Sample service QR"
        visible={qr}
        onClose={() => setQr(false)}
      >
        <Image
          source={require('../../assets/demo/service-qr.png')}
          style={{
            width: '100%',
            maxWidth: 320,
            aspectRatio: 1,
            alignSelf: 'center',
          }}
          accessibilityLabel="Public TPC demo service QR code"
        />
        <Text style={ui.body}>
          Open this QR on another screen to scan it, or use the manual sample
          code in the scanner. This cannot confirm real presence.
        </Text>
      </GivingSheet>
      <GivingSheet
        title="Attendance details"
        visible={!!record}
        onClose={() => {
          if (!syncing) {
            setSelected(null);
            setLoader(false);
          }
        }}
      >
        {record && !loader && (
          <>
            <Text style={ui.heading}>{record.serviceName}</Text>
            <Text accessibilityLiveRegion="polite" style={ui.label}>
              {labels[state(record)]}
            </Text>
            <Text style={ui.body}>
              Scan: {formatAttendanceStamp(record.scannedAt)} WAT
            </Text>
            <Text style={ui.body}>
              Upload deadline: {formatAttendanceStamp(record.uploadDeadlineAt)}{' '}
              WAT
            </Text>
            <Text style={ui.body}>
              {record.location
                ? 'Location and device timestamp captured with permission. These are evidence, not proof.'
                : record.witnessId
                  ? 'Sample witness confirmation retained.'
                  : 'No location evidence retained.'}
            </Text>
            {state(record) === 'awaitingWitness' && (
              <>
                <Text style={ui.body}>
                  Ask a verified member who attended this service to confirm
                  your presence. No usher or admin approval is required.
                </Text>
                <GivingButton
                  label="Prepare witness request (demo)"
                  disabled={busy}
                  onPress={() => {
                    void change(record.id, 'witnessRequested');
                  }}
                />
              </>
            )}
            {state(record) === 'witnessRequested' && (
              <>
                <Text style={ui.heading}>Witness confirmation</Text>
                <Text style={ui.body}>
                  Preview the response from another member. Nobody will be
                  contacted. Only the eligible sample witness can confirm.
                </Text>
                {witnesses.map((w) => (
                  <GivingButton
                    key={w.id}
                    label={w.name}
                    secondary
                    disabled={
                      busy || !eligibleWitness(w, record.serviceId, 'demo-self')
                    }
                    onPress={() => {
                      void change(record.id, 'queued', w);
                    }}
                  />
                ))}
              </>
            )}
            {['queued', 'syncError'].includes(state(record)) && (
              <>
                <Text style={ui.caption}>
                  Simulate upload and a server response:
                </Text>
                <GivingButton
                  label="Preview confirmed attendance"
                  disabled={busy}
                  onPress={() => {
                    void sync('confirmed');
                  }}
                />
                <GivingButton
                  label="Preview rejected attendance"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    void sync('rejected');
                  }}
                />
                <GivingButton
                  label="Preview sync error / offline"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    void sync('syncError');
                  }}
                />
                {state(record) === 'syncError' && (
                  <GivingButton
                    label="Retry queued demo"
                    secondary
                    disabled={busy}
                    onPress={() => {
                      void change(record.id, 'queued');
                    }}
                  />
                )}
              </>
            )}
            {state(record) === 'rejected' && (
              <Text style={ui.body}>
                Sample reason: the evidence could not confirm presence at this
                service. Review your scan time and evidence. No real attendance
                record has been rejected.
              </Text>
            )}
            {state(record) === 'expired' && (
              <Text style={ui.body}>
                The 24-hour upload deadline has passed. This evidence cannot be
                submitted through the demo sync controls.
              </Text>
            )}
            {state(record) === 'confirmed' && (
              <Text style={ui.body}>
                Your demo result has been saved in history. Production
                confirmation must come from the attendance server.
              </Text>
            )}
          </>
        )}
        <BrandedLoader
          inline
          visible={loader}
          complete={!syncing}
          success={
            !syncing &&
            records.find((r) => r.id === resultId)?.state === 'confirmed'
          }
          error={
            !syncing &&
            ['syncError', 'rejected', 'expired'].includes(
              records.find((r) => r.id === resultId)?.state || '',
            )
          }
          label={
            syncing
              ? 'Saving demo result…'
              : labels[
                  records.find((r) => r.id === resultId)?.state || 'syncError'
                ]
          }
          onClose={() => {
            if (!syncing) setLoader(false);
          }}
          closeLabel="Back to attendance"
        >
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            {notice}
          </Text>
        </BrandedLoader>
      </GivingSheet>
    </GivingPage>
  );
}
