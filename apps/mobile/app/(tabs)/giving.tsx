// ===============================================================
// apps/mobile/app/(tabs)/giving.tsx
// Review giving and create a local demo checkout. No money is charged.
// Active funds are fixtures until the backend catalog is connected.
// ===============================================================

import { useDemoWorkspace } from '@/store/demo-workspace';
import DemoStatus from '@/components/demo-status';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import {
  GivingButton,
  GivingChoice,
  GivingPage,
  GivingSheet,
  givingStyles as ui,
} from '@/components/giving-ui';
import {
  GIVING_CATEGORIES,
  GIVING_FUNDS,
  type GivingFund,
} from '@/constants/giving';
import { colors } from '@/constants/theme';
import { formatGivingAmount, parseGivingAmount } from '@/utils/giving';

type Review = { fund: GivingFund; amountMinor: number; email: string };

// ===============================================================
// GIVING DRAFT AND NAVIGATION GUARDS
// ===============================================================

export default function GivingScreen() {
  const { startPayment, ready, busy } = useDemoWorkspace();
  const focused = useRef(false);
  const checkoutGeneration = useRef(0);
  const checkoutPending = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        checkoutGeneration.current++;
        checkoutPending.current = false;
      };
    }, []),
  );
  function closeReview() {
    checkoutGeneration.current++;
    setReview(null);
  }
  const [fundId, setFundId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const activeFunds = GIVING_FUNDS.filter((fund) => fund.isActive);

  // ===============================================================
  // FUND, AMOUNT AND EMAIL VALIDATION
  // ===============================================================

  function reviewGiving() {
    Keyboard.dismiss();
    const fund = activeFunds.find((item) => item.id === fundId);
    if (!fund) {
      setError('Choose a giving category or campaign.');
      return;
    }

    const result = parseGivingAmount(amount);
    if (!result.valid) {
      setError(result.message);
      return;
    }

    const receiptEmail = email.trim();
    if (
      receiptEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail)
    ) {
      setError('Enter a receipt email address such as you@example.com.');
      return;
    }

    setError('');
    setCheckoutNotice('');
    setReview({ fund, amountMinor: result.amountMinor, email: receiptEmail });
  }

  // ===============================================================
  // SELECTABLE FUND CARDS
  // ===============================================================

  function renderFund(fund: GivingFund) {
    const selected = fundId === fund.id;
    return (
      <Pressable
        key={fund.id}
        accessibilityRole="radio"
        accessibilityLabel={fund.name}
        accessibilityState={{ checked: selected }}
        onPress={() => {
          setFundId(fund.id);
          setError('');
        }}
        style={({ pressed }) => [
          ui.card,
          selected && ui.selected,
          pressed && ui.pressed,
        ]}
      >
        <View style={ui.row}>
          <Text style={ui.heading}>{fund.name}</Text>
          {selected && <Text style={ui.link}>Selected</Text>}
        </View>
        <Text style={ui.body}>{fund.description}</Text>
        {fund.category === 'program' && (
          <Text style={ui.caption}>Sample campaign</Text>
        )}
      </Pressable>
    );
  }

  // ===============================================================
  // GIVING AND REVIEW INTERFACE
  // ===============================================================

  return (
    <>
      <GivingPage
        title="Give with purpose"
        subtitle="Choose where your gift will make a difference."
      >
        <DemoStatus />
        <View style={[ui.card, ui.hero]}>
          <Text style={ui.heading}>Every gift has a purpose</Text>
          <Text style={ui.heroBody}>
            Support worship, church projects and care for our community.
          </Text>
          <Text style={ui.heroBody}>
            UI preview · No money will be charged.
          </Text>
        </View>

        <Text accessibilityRole="header" style={ui.heading}>
          Choose your giving
        </Text>
        <View accessibilityRole="radiogroup" style={ui.stack}>
          {activeFunds
            .filter((fund) => fund.category !== 'program')
            .map(renderFund)}
        </View>

        {activeFunds.some((fund) => fund.category === 'program') && (
          <>
            <Text accessibilityRole="header" style={ui.heading}>
              Programs & campaigns
            </Text>
            <View accessibilityRole="radiogroup" style={ui.stack}>
              {activeFunds
                .filter((fund) => fund.category === 'program')
                .map(renderFund)}
            </View>
          </>
        )}

        <View style={ui.card}>
          <Text style={ui.label}>Amount (NGN)</Text>
          <TextInput
            accessibilityLabel="Giving amount in naira"
            style={ui.input}
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              setError('');
            }}
            placeholder="For example, 1,000.00"
            placeholderTextColor={colors.secondaryText}
            keyboardType="decimal-pad"
            maxLength={24}
          />
          <Text style={ui.caption}>
            Enter ₦100–₦1,000,000, with up to two decimal places.
          </Text>
          <View style={ui.wrap}>
            {[500, 1000, 5000].map((value) => (
              <GivingChoice
                key={value}
                label={formatGivingAmount(value * 100)}
                selected={
                  parseGivingAmount(amount).valid &&
                  Number(amount.replace(/,/g, '')) === value
                }
                onPress={() => {
                  setAmount(String(value));
                  setError('');
                }}
              />
            ))}
          </View>

          <Text style={ui.label}>Receipt email</Text>
          <TextInput
            accessibilityLabel="Receipt email address"
            style={ui.input}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            placeholder="you@example.com"
            placeholderTextColor={colors.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
            returnKeyType="done"
            onSubmitEditing={reviewGiving}
          />
          <Text style={ui.caption}>
            For payment receipts. This does not change how you sign in.
          </Text>
          {error !== '' && (
            <Text accessibilityRole="alert" style={ui.error}>
              {error}
            </Text>
          )}
          <GivingButton label="Review giving" onPress={reviewGiving} />
        </View>

        <GivingButton
          label="View payment history"
          secondary
          onPress={() => router.navigate('/(tabs)/history')}
        />
      </GivingPage>

      <GivingSheet
        title="Review your giving"
        visible={review !== null}
        onClose={closeReview}
      >
        {review && (
          <>
            <View style={ui.card}>
              <Text style={ui.eyebrow}>
                {GIVING_CATEGORIES[review.fund.category]}
              </Text>
              <Text style={ui.heading}>{review.fund.name}</Text>
              <Text style={ui.amount}>
                {formatGivingAmount(review.amountMinor)}
              </Text>
              <Text style={ui.label}>Receipt email</Text>
              <Text style={ui.body}>{review.email}</Text>
            </View>
            <Text style={ui.body}>
              Check the fund, amount and email before proceeding. This preview
              cannot charge you.
            </Text>
            <GivingButton
              label="Continue to demo payment"
              disabled={!ready || busy}
              onPress={async () => {
                if (checkoutPending.current) return;
                checkoutPending.current = true;
                const operation = ++checkoutGeneration.current;
                const reference =
                  'DEMO-' +
                  Date.now() +
                  '-' +
                  Math.random().toString(36).slice(2, 10);
                const ok = await startPayment({
                  reference,
                  fundId: review.fund.id,
                  fundName: review.fund.name,
                  category: review.fund.category,
                  amountMinor: review.amountMinor,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                });
                checkoutPending.current = false;
                if (
                  !focused.current ||
                  checkoutGeneration.current !== operation
                )
                  return;
                if (ok) {
                  setReview(null);
                  router.navigate({
                    pathname: '/(tabs)/checkout',
                    params: { reference },
                  });
                } else
                  setCheckoutNotice(
                    'Checkout could not be saved. Check device storage or the demo record limit in Settings.',
                  );
              }}
            />
            {checkoutNotice !== '' && (
              <Text accessibilityRole="alert" style={ui.body}>
                {checkoutNotice}
              </Text>
            )}
            <GivingButton
              label="Edit giving"
              secondary
              disabled={busy}
              onPress={closeReview}
            />
          </>
        )}
      </GivingSheet>
    </>
  );
}
