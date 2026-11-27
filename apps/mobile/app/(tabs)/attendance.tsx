// ===============================================================
// File: apps/mobile/app/(tabs)/attendance.tsx
// Description: Service check-in, live TPC schedule hero card, and attendance queue.
// Author: Josiah Ewumi
// ===============================================================

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Calendar, Clock, MapPin, QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import BrandedLoader from '@/components/branded-loader';
import {
  GivingButton,
  GivingPage,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import { fonts, palette, radii, shadows } from '@/constants/theme';
import { useHomeData } from '@/hooks/use-home-data';
import {
  useAttendanceDraft,
  type AttendanceRecord,
} from '@/store/attendance-draft';
import { formatAttendanceStamp, getAttendanceWindow } from '@/utils/attendance';
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

export default function AttendanceScreen() {
  const { nextService, countdown, formattedServiceDateTime } = useHomeData();
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
  const activeServiceStart = nextService?.startsAtMs ?? service.startsAt;
  const activeServiceEnd = nextService?.endsAtMs ?? service.endsAt;
  const window = nextService
    ? {
        opensAt: nextService.checkInOpensAtMs,
        closesAt: nextService.checkInClosesAtMs,
        uploadDeadlineAt: nextService.endsAtMs + 24 * 60 * 60_000,
      }
    : getAttendanceWindow(service);

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

  return (
    <GivingPage
      title="Attendance & Check-in"
      subtitle="Scan the auditorium QR code during service to confirm your attendance."
      sectionLabel="CHECK-IN"
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

      {/* Gold Service Spotlight Card */}
      <View style={[styles.heroShadow, shadows.hero]}>
        <LinearGradient
          colors={palette.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroEyebrow}>UPCOMING SERVICE</Text>
            {countdown && (
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{countdown.badgeLabel}</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle}>
            {nextService?.title ?? 'Sunday Worship Service'}
          </Text>

          {!!nextService?.periodLabel && (
            <Text style={styles.heroPeriod}>{nextService.periodLabel}</Text>
          )}

          <View style={styles.heroMetaList}>
            <View style={styles.heroMetaRow}>
              <Calendar size={15} color="rgba(255,255,255,0.92)" />
              <Text style={styles.heroMetaText}>
                {nextService
                  ? formattedServiceDateTime
                  : `${formatAttendanceStamp(activeServiceStart)} WAT`}
              </Text>
            </View>
            <View style={styles.heroMetaRow}>
              <Clock size={15} color="rgba(255,255,255,0.92)" />
              <Text style={styles.heroMetaText}>
                Ends {formatAttendanceStamp(activeServiceEnd)} WAT
              </Text>
            </View>
            <View style={styles.heroMetaRow}>
              <MapPin size={15} color="rgba(255,255,255,0.92)" />
              <Text style={styles.heroMetaText}>
                {nextService?.location ?? 'Main Auditorium'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <GivingButton
        label={attempt ? 'View Current Check-in' : 'Scan Service QR'}
        disabled={!ready || busy}
        onPress={() =>
          attempt ? setSelected(attempt.id) : router.navigate('/(tabs)/scanner')
        }
      />
      <GivingButton
        label="Show Sample Service QR"
        secondary
        onPress={() => setQr(true)}
      />

      <View style={ui.card}>
        <View style={styles.cardIconTitle}>
          <QrCode size={18} color={palette.goldIcon} />
          <Text style={ui.heading}>Check-in Window</Text>
        </View>
        {window && (
          <>
            <Text style={ui.body}>
              Opens: {formatAttendanceStamp(window.opensAt)} WAT
            </Text>
            <Text style={ui.body}>
              Closes: {formatAttendanceStamp(window.closesAt)} WAT
            </Text>
            <Text style={ui.body}>
              Offline upload deadline:{' '}
              {formatAttendanceStamp(window.uploadDeadlineAt)} WAT
            </Text>
          </>
        )}
        <Text style={ui.caption}>
          Check-in opens 30 minutes before service starts and closes 30 minutes
          after it ends.
        </Text>
      </View>

      <Text style={ui.heading}>Attendance History & Offline Queue</Text>
      <Text style={ui.body}>
        {Platform.OS === 'web'
          ? 'Browser reloads keep sample history without GPS coordinates.'
          : 'Your native queue persists locally in encrypted device storage.'}
      </Text>

      {!records.length && (
        <View style={ui.card}>
          <Text style={ui.heading}>Your attendance journey starts here</Text>
          <Text style={ui.body}>
            Scan the service QR when check-in opens, or test the sample QR flow
            above.
          </Text>
        </View>
      )}

      {records.map((r) => (
        <View key={r.id} style={ui.card}>
          <Text style={ui.heading}>{r.serviceName}</Text>
          <Text style={ui.label}>{labels[state(r)]}</Text>
          <Text style={ui.body}>{formatAttendanceStamp(r.scannedAt)} WAT</Text>
          <GivingButton
            label="View Attendance Details"
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
        title="Sample Service QR"
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
          Open this QR on another screen to scan it with the QR scanner. This
          sample pass is for preview testing only.
        </Text>
      </GivingSheet>

      <GivingSheet
        title="Attendance Details"
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
                ? 'Location and device timestamp captured with permission.'
                : record.witnessId
                  ? 'Sample witness confirmation retained.'
                  : 'No location evidence retained.'}
            </Text>
            {state(record) === 'awaitingWitness' && (
              <>
                <Text style={ui.body}>
                  Ask a verified member who attended this service to confirm
                  your presence.
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
                  Simulate upload and server response (Demo preview):
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
                service.
              </Text>
            )}
            {state(record) === 'expired' && (
              <Text style={ui.body}>
                The 24-hour upload deadline has passed.
              </Text>
            )}
            {state(record) === 'confirmed' && (
              <Text style={ui.body}>
                Your demo result has been saved in history.
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

const styles = StyleSheet.create({
  heroShadow: {
    borderRadius: radii.hero,
  },
  heroCard: {
    borderRadius: radii.hero,
    padding: 20,
    gap: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.88)',
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: palette.surface,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 23,
    lineHeight: 29,
    color: palette.surface,
  },
  heroPeriod: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
  },
  heroMetaList: {
    marginTop: 6,
    gap: 5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.95)',
  },
  cardIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
