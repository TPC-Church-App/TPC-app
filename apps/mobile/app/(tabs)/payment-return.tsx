// ===============================================================
// apps/mobile/app/(tabs)/payment-return.tsx
// Apply explicit local outcomes without trusting return URLs.
// ===============================================================

// Navigation parameters describe a scenario; they never verify a real payment.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  givingStyles as ui,
} from '@/components/giving-ui';
import BrandedLoader from '@/components/branded-loader';
import DemoStatus from '@/components/demo-status';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { isPaymentStatus, receiptAvailable } from '@/utils/member-demo';
import { GIVING_STATUS_LABELS } from '@/constants/giving';

// ===============================================================
// OWNED REFERENCE AND RETURN SCENARIO
// ===============================================================

export default function PaymentReturnScreen() {
  const params = useLocalSearchParams<{
    reference?: string;
    status?: string;
  }>();
  const { data, ready, busy, applyReturn } = useDemoWorkspace();
  const payment = data.payments.find((p) => p.reference === params.reference);
  const outcome = isPaymentStatus(params.status) ? params.status : null;
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [applied, setApplied] = useState(false);

  // ===============================================================
  // SAVE THE EXPLICIT DEMO RETURN OUTCOME
  // ===============================================================

  async function apply() {
    if (!payment || !outcome) return;
    setDone(false);
    setLoading(true);
    const ok = await applyReturn(payment.reference, outcome);
    setDone(true);
    setApplied(ok);
    setNotice(
      ok
        ? 'Demo return processed. The saved status below follows replay and terminal-state rules. No payment was verified.'
        : 'Could not save the demo return. Retry after checking storage.',
    );
  }

  // ===============================================================
  // PAYMENT RETURN AND RESULT INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Payment return"
      subtitle="Return and verification states for the frontend demo."
      sectionLabel="PAYMENT RETURN"
    >
      <DemoStatus />
      {!ready ? (
        <Text style={ui.body}>Loading saved checkout…</Text>
      ) : !payment || !outcome ? (
        <View style={ui.card}>
          <Text accessibilityRole="alert" style={ui.error}>
            Unknown reference or unsupported return status. No record has been
            created or changed.
          </Text>
          <GivingButton
            label="Open payment history"
            onPress={() => router.navigate('/(tabs)/history')}
          />
        </View>
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.heading}>{payment.fundName}</Text>
            <Text selectable style={ui.caption}>
              {payment.reference}
            </Text>
            <Text style={ui.body}>
              Requested demo outcome: {GIVING_STATUS_LABELS[outcome]}
            </Text>
            <Text accessibilityLiveRegion="polite" style={ui.label}>
              Saved status: {GIVING_STATUS_LABELS[payment.status]}
            </Text>
            <Text style={ui.body}>
              A callback URL cannot confirm a real payment. Live success must
              wait for server verification. This button deliberately applies a
              local demo outcome.
            </Text>
            <GivingButton
              label="Apply demo return outcome"
              disabled={busy}
              onPress={() => {
                void apply();
              }}
            />
          </View>
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={ui.body}>
              {notice}
            </Text>
          )}
          {receiptAvailable(payment) && (
            <GivingButton
              label="View demo receipt"
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/receipt',
                  params: { reference: payment.reference },
                })
              }
            />
          )}
          <GivingButton
            label="View payment history"
            secondary
            onPress={() => router.navigate('/(tabs)/history')}
          />
          <GivingButton
            label="Return to demo checkout"
            secondary
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/checkout',
                params: { reference: payment.reference },
              })
            }
          />
        </>
      )}
      <BrandedLoader
        visible={loading}
        complete={done}
        error={
          done &&
          (!applied ||
            ['failed', 'abandoned', 'reversed'].includes(payment?.status || ''))
        }
        success={done && applied && payment?.status === 'successful'}
        label={done ? 'Demo return processed' : 'Saving demo return…'}
        onClose={() => {
          if (done) setLoading(false);
        }}
        closeLabel="View payment result"
      >
        <Text style={ui.body}>{notice}</Text>
      </BrandedLoader>
    </GivingPage>
  );
}
