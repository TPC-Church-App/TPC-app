// ===============================================================
// apps/mobile/app/(tabs)/history.tsx
// Keep saved demo checkouts separate from optional sample history.
// ===============================================================

import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import {
  GivingPage,
  GivingButton,
  GivingSheet,
  GivingSelectionSheet,
  useGivingStyles,
} from '@/components/giving-ui';
import DemoStatus from '@/components/demo-status';
import {
  GIVING_CATEGORIES,
  GIVING_STATUS_LABELS,
  SAMPLE_GIVING_RECORDS,
  type GivingCategory,
} from '@/constants/giving';
import {
  PAYMENT_STATUSES,
  receiptAvailable,
  type DemoPayment,
  type PaymentStatus,
} from '@/utils/member-demo';
import { useDemoWorkspace } from '@/store/demo-workspace';
import { formatGivingAmount, formatGivingDate } from '@/utils/giving';

// ===============================================================
// PAYMENT HISTORY AND FILTERS
// ===============================================================

export default function HistoryScreen() {
  const ui = useGivingStyles();
  const { data } = useDemoWorkspace();
  const [samples, setSamples] = useState(false);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [filterPicker, setFilterPicker] = useState<
    'category' | 'status' | null
  >(null);
  const [selected, setSelected] = useState<DemoPayment | null>(null);
  const records: DemoPayment[] = samples
    ? SAMPLE_GIVING_RECORDS.map((p) => ({ ...p }))
    : data.payments;
  const rows = records.filter(
    (r) =>
      (category === 'all' || r.category === category) &&
      (status === 'all' || r.status === status),
  );
  const active = selected
    ? samples
      ? selected
      : data.payments.find((p) => p.reference === selected.reference)
    : null;

  // ===============================================================
  // HISTORY INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Payment history"
      subtitle="See the purpose, amount and outcome of each demo gift."
      sectionLabel="PAYMENTS"
    >
      <DemoStatus />
      <GivingButton
        label="Make a demo gift"
        onPress={() => router.navigate('/(tabs)/giving')}
      />
      <GivingButton
        label={
          samples ? 'Show my saved demo checkouts' : 'Show sample illustrations'
        }
        secondary
        onPress={() => {
          setSamples((v) => !v);
          setSelected(null);
          setCategory('all');
          setStatus('all');
        }}
      />
      <Text style={ui.caption}>
        {samples
          ? 'Sample illustrations do not belong to you.'
          : 'Saved on this device. These are demo checkout records, not real payments.'}
      </Text>
      <Text style={ui.label}>Filter payments</Text>
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <GivingButton
            label={`${category === 'all' ? 'All types' : GIVING_CATEGORIES[category as GivingCategory]}  ▾`}
            secondary
            onPress={() => setFilterPicker('category')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <GivingButton
            label={`${status === 'all' ? 'All statuses' : GIVING_STATUS_LABELS[status as PaymentStatus]}  ▾`}
            secondary
            onPress={() => setFilterPicker('status')}
          />
        </View>
      </View>
      {!rows.length && (
        <View style={ui.card}>
          <Text style={ui.heading}>No matching demo payments</Text>
          <Text style={ui.body}>
            Try a different filter or create a demo checkout from Giving.
          </Text>
        </View>
      )}
      {rows.map((p) => (
        <Pressable
          key={p.reference}
          accessibilityRole="button"
          accessibilityLabel={
            p.fundName +
            ', ' +
            formatGivingAmount(p.amountMinor) +
            ', ' +
            GIVING_STATUS_LABELS[p.status]
          }
          style={({ pressed }) => [ui.card, pressed && ui.pressed]}
          onPress={() => setSelected(p)}
        >
          <Text style={ui.eyebrow}>
            {GIVING_CATEGORIES[p.category as GivingCategory]}
          </Text>
          <Text style={ui.heading}>{p.fundName}</Text>
          <Text style={ui.amount}>{formatGivingAmount(p.amountMinor)}</Text>
          <Text style={ui.label}>{GIVING_STATUS_LABELS[p.status]}</Text>
          <Text style={ui.caption}>{formatGivingDate(p.createdAt)}</Text>
          <Text style={ui.link}>View details →</Text>
        </Pressable>
      ))}
      <GivingSelectionSheet
        title={
          filterPicker === 'category'
            ? 'Filter by giving type'
            : 'Filter by payment status'
        }
        visible={filterPicker !== null}
        onClose={() => setFilterPicker(null)}
      >
        {(filterPicker === 'category'
          ? [['all', 'All types'], ...Object.entries(GIVING_CATEGORIES)]
          : [
              ['all', 'All statuses'],
              ...PAYMENT_STATUSES.map((value) => [
                value,
                GIVING_STATUS_LABELS[value],
              ]),
            ]
        ).map(([value, label]) => (
          <GivingButton
            key={value}
            label={`${label}${(filterPicker === 'category' ? category : status) === value ? '  ✓' : ''}`}
            secondary
            onPress={() => {
              if (filterPicker === 'category') setCategory(value);
              else setStatus(value);
              setFilterPicker(null);
            }}
          />
        ))}
      </GivingSelectionSheet>
      <GivingSheet
        title="Demo payment details"
        visible={!!active}
        onClose={() => setSelected(null)}
      >
        {active && (
          <>
            <Text style={ui.heading}>{active.fundName}</Text>
            <Text style={ui.amount}>
              {formatGivingAmount(active.amountMinor)}
            </Text>
            <Text style={ui.label}>{GIVING_STATUS_LABELS[active.status]}</Text>
            <Text selectable style={ui.body}>
              {active.reference}
            </Text>
            <Text style={ui.caption}>
              {samples
                ? 'Illustration only. Sample records have no receipt.'
                : 'Saved demo only. No actual payment was made.'}
            </Text>
            {!samples && receiptAvailable(active) && (
              <GivingButton
                label="View demo receipt"
                onPress={() => {
                  setSelected(null);
                  router.navigate({
                    pathname: '/(tabs)/receipt',
                    params: { reference: active.reference },
                  });
                }}
              />
            )}
            {!samples && (
              <GivingButton
                label="Open demo checkout / return scenarios"
                secondary
                onPress={() => {
                  setSelected(null);
                  router.navigate({
                    pathname: '/(tabs)/checkout',
                    params: { reference: active.reference },
                  });
                }}
              />
            )}
          </>
        )}
      </GivingSheet>
    </GivingPage>
  );
}
