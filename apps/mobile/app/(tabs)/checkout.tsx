// ===============================================================
// apps/mobile/app/(tabs)/checkout.tsx
// Preview checkout for locally owned demo references.
// ===============================================================

// Only a locally owned DEMO reference can open checkout. No card data is collected.
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingChoice,
  givingStyles as ui,
} from '@/components/giving-ui';
import DemoStatus from '@/components/demo-status';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { PAYMENT_STATUSES, type PaymentStatus } from '@/utils/member-demo';
import { GIVING_STATUS_LABELS } from '@/constants/giving';
import { formatGivingAmount } from '@/utils/giving';

// ===============================================================
// OWNED DEMO CHECKOUT
// ===============================================================

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ reference?: string }>();
  const { data, ready } = useDemoWorkspace();
  const payment = data.payments.find((p) => p.reference === params.reference);
  const [status, setStatus] = useState<PaymentStatus>('successful');

  // ===============================================================
  // CHECKOUT OUTCOME INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Demo checkout"
      subtitle="Explore payment outcomes without making a payment."
      sectionLabel="CHECKOUT"
    >
      <DemoStatus />
      {!ready ? (
        <Text style={ui.body}>Loading checkout…</Text>
      ) : !payment ? (
        <View style={ui.card}>
          <Text accessibilityRole="alert" style={ui.error}>
            This demo checkout reference was not found on this device.
          </Text>
          <GivingButton
            label="Choose a gift"
            onPress={() => router.navigate('/(tabs)/giving')}
          />
        </View>
      ) : (
        <>
          <View style={ui.card}>
            <Text style={ui.heading}>{payment.fundName}</Text>
            <Text style={ui.amount}>
              {formatGivingAmount(payment.amountMinor)}
            </Text>
            <Text selectable style={ui.caption}>
              {payment.reference}
            </Text>
            <Text style={ui.label}>
              Saved status: {GIVING_STATUS_LABELS[payment.status]}
            </Text>
            <Text style={ui.body}>
              No Paystack window will open and no money will be charged. Choose
              the return outcome to preview.
            </Text>
          </View>
          <View style={ui.wrap}>
            {PAYMENT_STATUSES.map((value) => (
              <GivingChoice
                key={value}
                label={GIVING_STATUS_LABELS[value]}
                selected={status === value}
                onPress={() => setStatus(value)}
              />
            ))}
          </View>
          <GivingButton
            label="Preview payment return"
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/payment-return',
                params: { reference: payment.reference, status },
              })
            }
          />
          <GivingButton
            label="Cancel demo checkout"
            secondary
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/payment-return',
                params: { reference: payment.reference, status: 'abandoned' },
              })
            }
          />
          <GivingButton
            label="Back to payment history"
            secondary
            onPress={() => router.navigate('/(tabs)/history')}
          />
        </>
      )}
    </GivingPage>
  );
}
