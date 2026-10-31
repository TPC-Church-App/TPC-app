// ===============================================================
// apps/mobile/app/(tabs)/receipt.tsx
// Display only eligible, watermarked demo receipts.
// ===============================================================

import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import {
  GivingPage,
  GivingButton,
  givingStyles as ui,
} from '@/components/giving-ui';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { receiptAvailable } from '@/utils/member-demo';
import { formatGivingAmount, formatGivingDate } from '@/utils/giving';
import { GIVING_CATEGORIES, type GivingCategory } from '@/constants/giving';

// ===============================================================
// SUCCESSFUL DEMO RECEIPT ELIGIBILITY
// ===============================================================

export default function ReceiptScreen() {
  const { reference } = useLocalSearchParams<{ reference?: string }>();
  const { data, ready } = useDemoWorkspace();
  const p = data.payments.find((r) => r.reference === reference);
  return (
    <GivingPage
      title="Demo receipt"
      subtitle="Layout preview only · Not proof of payment."
      sectionLabel="RECEIPT"
    >
      {!ready ? (
        <Text style={ui.body}>Loading…</Text>
      ) : receiptAvailable(p) && p ? (
        <View style={ui.card}>
          <Text style={ui.eyebrow}>DEMO · NO MONEY RECEIVED</Text>
          <Text style={ui.heading}>{p.fundName}</Text>
          <Text style={ui.body}>
            {GIVING_CATEGORIES[p.category as GivingCategory]}
          </Text>
          <Text style={ui.amount}>{formatGivingAmount(p.amountMinor)}</Text>
          <Text style={ui.label}>Successful demo outcome</Text>
          <Text style={ui.body}>{formatGivingDate(p.createdAt)}</Text>
          <Text selectable style={ui.body}>
            {p.reference}
          </Text>
          <Text style={ui.caption}>
            This document illustrates the receipt UI. It does not confirm a
            donation, provide tax evidence or replace a server-issued receipt.
          </Text>
        </View>
      ) : (
        <Text accessibilityRole="alert" style={ui.error}>
          No successful saved demo payment was found. Pending, failed, abandoned
          and reversed payments cannot display a success receipt.
        </Text>
      )}
      <GivingButton
        label="Back to payment history"
        secondary
        onPress={() => router.navigate('/(tabs)/history')}
      />
    </GivingPage>
  );
}
