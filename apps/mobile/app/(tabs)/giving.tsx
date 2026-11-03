// ===============================================================
// apps/mobile/app/(tabs)/giving.tsx
// Select an active church fund, start secure checkout and verify the
// final payment state with the server before showing it as successful.
// ===============================================================
import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import {
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import {
  GivingButton,
  GivingChoice,
  GivingPage,
  givingStyles as ui,
} from '@/components/giving-ui';
import { MIN_GIVING_NAIRA, parseGivingAmount } from '@/utils/giving';
import {
  getGivingOptionId,
  GIVING_OPTIONS,
  type GivingOptionId,
} from '@/utils/giving-categories';
import {
  parsePaystackCheckout,
  parsePaymentVerification,
  type VerifiedPaymentStatus,
} from '@/utils/paystack';

const QUICK_AMOUNTS = [MIN_GIVING_NAIRA, 1000, 2000, 5000, 10000];

// ===============================================================
// LIVE FUND AND PAYMENT SELECTION TYPES
// ===============================================================
type ActiveFund = {
  id: string;
  name: string;
  description: string | null;
};
type SelectionId = GivingOptionId | 'other';

function getPaymentStatusMessage(status: VerifiedPaymentStatus) {
  switch (status) {
    case 'successful':
      return 'Payment confirmed by the server. Your history is refreshing.';
    case 'pending':
    case 'ongoing':
    case 'processing':
    case 'queued':
      return 'The server has not confirmed this payment yet. Wait briefly, then check again.';
    case 'abandoned':
      return 'This checkout was cancelled. It has not been marked as paid.';
    case 'failed':
      return 'The server reports that this payment failed. You can start a new checkout.';
    case 'reversed':
      return 'The server reports that this payment was reversed. Contact the church office if you need help.';
    default:
      return 'The server returned an unrecognized payment status.';
  }
}

export default function GivingScreen() {
  const [funds, setFunds] = useState<ActiveFund[]>([]);
  const [categoryId, setCategoryId] = useState<SelectionId | null>(null);
  const [fundId, setFundId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [fundsError, setFundsError] = useState('');
  const [fundsLoading, setFundsLoading] = useState(true);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // ===============================================================
  // LOAD ONLY FUNDS THAT THE CHURCH HAS ACTIVATED
  // ===============================================================
  const loadFunds = useCallback(async () => {
    setFundsLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('funds')
        .select('id, name, description, is_active')
        .eq('is_active', true);
      if (queryError) {
        setFunds([]);
        setFundId(null);
        setFundsError(
          'Giving options could not load. Check your connection and retry.',
        );
        return;
      }
      const activeFunds = (data ?? []).flatMap((fund): ActiveFund[] => {
        if (
          typeof fund.id !== 'string' ||
          typeof fund.name !== 'string' ||
          fund.is_active !== true
        ) {
          return [];
        }
        return [
          {
            id: fund.id,
            name: fund.name,
            description:
              typeof fund.description === 'string' ? fund.description : null,
          },
        ];
      });
      setFunds(activeFunds);
      setFundId((current) =>
        activeFunds.some((fund) => fund.id === current) ? current : null,
      );
      setFundsError('');
    } catch {
      setFunds([]);
      setFundId(null);
      setFundsError(
        'Giving options could not load. Check your connection and retry.',
      );
    } finally {
      setFundsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFunds();
  }, [loadFunds]);

  const hasOtherFunds = funds.some((fund) => !getGivingOptionId(fund.name));
  const givingOptions = hasOtherFunds
    ? [...GIVING_OPTIONS, { id: 'other' as const, label: 'Other active funds' }]
    : GIVING_OPTIONS;
  const categoryFunds = categoryId
    ? funds.filter((fund) =>
        categoryId === 'other'
          ? !getGivingOptionId(fund.name)
          : getGivingOptionId(fund.name) === categoryId,
      )
    : [];

  // ===============================================================
  // ASK THE SERVER TO CONFIRM THE PAYMENT OUTCOME
  // Browser return state never proves that a payment succeeded.
  // ===============================================================
  async function checkPaymentStatus(reference: string) {
    try {
      const { data, error: verifyError } = await supabase.functions.invoke(
        'offerings-verify',
        { body: { reference } },
      );
      if (verifyError) {
        setPaymentNotice(
          'The server could not confirm the payment status. Try checking again.',
        );
        return;
      }
      const status = parsePaymentVerification(data);
      if (!status) {
        setPaymentNotice('The server returned an unrecognized payment status.');
        return;
      }
      setPaymentNotice(getPaymentStatusMessage(status));
      if (status === 'successful') {
        router.navigate('/(tabs)/history');
      }
    } catch {
      setPaymentNotice(
        'We could not check the payment status. Check your connection.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ===============================================================
  // CREATE A SERVER-OWNED PAYMENT AND OPEN PAYSTACK CHECKOUT
  // Paystack's callback supplies only a reference; verify it with the server.
  // ===============================================================
  async function handleGive() {
    Keyboard.dismiss();
    const fund = funds.find((f) => f.id === fundId);
    if (!fund) return setError('Choose a giving category.');

    const result = parseGivingAmount(amount);
    if (!result.valid) return setError(result.message);

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'offerings-initialize',
        {
          body: { amount: result.amountMinor / 100, fund_id: fund.id },
        },
      );

      if (error) throw error;

      const checkout = parsePaystackCheckout(data);
      if (!checkout) {
        setError(
          'The payment service returned an unexpected response. Try again.',
        );
        setLoading(false);
        return;
      }

      setPendingReference(checkout.reference);
      setPaymentNotice(
        'Complete checkout in your browser, return here, then check the payment status.',
      );
      const returnUrl = ExpoLinking.createURL('payment-return');
      if (Platform.OS === 'web' || !returnUrl.startsWith('tpc://')) {
        await WebBrowser.openBrowserAsync(checkout.authorizationUrl);
        setPaymentNotice(
          'Checkout opened. Return to TPC and check the server status when you are done.',
        );
        setLoading(false);
        return;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        checkout.authorizationUrl,
        returnUrl,
      );
      if (browserResult.type === 'success' && 'url' in browserResult) {
        const returnedReference = new URL(browserResult.url).searchParams.get(
          'reference',
        );
        if (returnedReference !== checkout.reference) {
          setPaymentNotice(
            'The return reference did not match this checkout. Check the payment status with the server.',
          );
          setLoading(false);
          return;
        }
        router.replace({
          pathname: '/(tabs)/payment-return',
          params: { reference: returnedReference },
        });
        return;
      }

      setPaymentNotice(
        'Checkout was closed. Check the server status before starting another gift.',
      );
      setLoading(false);
    } catch {
      setError(
        'We could not start or open secure checkout. Check your connection and try again.',
      );
      setLoading(false);
    }
  }

  return (
    <GivingPage
      title="Give with purpose"
      subtitle="Choose where your gift will make a difference."
    >
      <View style={[ui.card, ui.hero]}>
        <Text style={ui.heading}>Every gift has a purpose</Text>
        <Text style={ui.heroBody}>
          Support worship, church projects and care for our community.
        </Text>
      </View>

      <Text accessibilityRole="header" style={ui.heading}>
        What would you like to give?
      </Text>
      <View accessibilityRole="radiogroup" style={ui.wrap}>
        {givingOptions.map((option) => {
          const matchingFunds = funds.filter((fund) =>
            option.id === 'other'
              ? !getGivingOptionId(fund.name)
              : getGivingOptionId(fund.name) === option.id,
          );
          const selected = categoryId === option.id;
          const loadingFunds = fundsLoading;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: loadingFunds }}
              disabled={loadingFunds}
              onPress={() => {
                setCategoryId(option.id);
                setFundId(
                  matchingFunds.length === 1 ? matchingFunds[0].id : null,
                );
                setError('');
              }}
              style={({ pressed }) => [
                ui.choice,
                selected && ui.selected,
                loadingFunds && ui.disabled,
                pressed && ui.pressed,
              ]}
            >
              <Text style={ui.link}>{option.label}</Text>
              <Text style={ui.caption}>
                {fundsLoading
                  ? 'Loading funds…'
                  : fundsError
                    ? 'Availability could not load'
                    : matchingFunds.length === 0
                      ? 'No active fund yet'
                      : `${matchingFunds.length} active fund${matchingFunds.length === 1 ? '' : 's'}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {fundsLoading && <Text style={ui.body}>Loading giving options…</Text>}
      {categoryId &&
        !fundsLoading &&
        !fundsError &&
        categoryFunds.length === 0 && (
          <View style={ui.card}>
            <Text style={ui.body}>
              No active fund is published for this giving type yet. The church
              can make it available when its fund details are ready.
            </Text>
          </View>
        )}
      {!categoryId &&
        !fundsLoading &&
        funds.length === 0 &&
        fundsError === '' && (
          <Text style={ui.body}>
            Giving types will become available when the church publishes active
            funds.
          </Text>
        )}

      {categoryId && !fundsLoading && categoryFunds.length > 0 && (
        <View style={ui.stack}>
          {categoryFunds.length > 1 && (
            <Text accessibilityRole="header" style={ui.heading}>
              Choose a{' '}
              {givingOptions
                .find((item) => item.id === categoryId)
                ?.label.toLowerCase()}{' '}
              fund
            </Text>
          )}
          {categoryFunds.map((fund) => {
            const selected = fundId === fund.id;
            return (
              <Pressable
                key={fund.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
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
                {!!fund.description && (
                  <Text style={ui.body}>{fund.description}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {fundsError !== '' && (
        <View style={ui.card}>
          <Text accessibilityRole="alert" style={ui.error}>
            {fundsError}
          </Text>
          <GivingButton
            label="Retry loading giving options"
            secondary
            onPress={() => void loadFunds()}
          />
        </View>
      )}

      <View style={ui.card}>
        <Text style={ui.label}>Amount (NGN)</Text>
        <Text style={ui.caption}>
          Choose a suggested amount or enter another amount.
        </Text>
        <View accessibilityRole="radiogroup" style={ui.wrap}>
          {QUICK_AMOUNTS.map((quickAmount) => (
            <GivingChoice
              key={quickAmount}
              label={`₦${quickAmount.toLocaleString('en-NG')}`}
              selected={amount === String(quickAmount)}
              onPress={() => {
                setAmount(String(quickAmount));
                setError('');
              }}
            />
          ))}
        </View>
        <TextInput
          style={ui.input}
          value={amount}
          onChangeText={(val) => {
            setAmount(val);
            setError('');
          }}
          accessibilityLabel="Gift amount in naira"
          placeholder="Other amount"
          placeholderTextColor={colors.secondaryText}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Text style={ui.caption}>
          The maximum gift is ₦{(1_000_000).toLocaleString('en-NG')}.
        </Text>

        {error !== '' && (
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
        )}

        <GivingButton
          label={loading ? 'Processing...' : 'Proceed to Pay'}
          onPress={handleGive}
          disabled={loading || fundsLoading || !fundId || !!fundsError}
        />
      </View>

      {pendingReference && (
        <View style={ui.card}>
          <Text style={ui.heading}>Payment status</Text>
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            {paymentNotice}
          </Text>
          <Text style={ui.caption}>Reference: {pendingReference}</Text>
          <GivingButton
            label={
              loading
                ? 'Checking with the server…'
                : 'Check payment status manually'
            }
            onPress={() => {
              setLoading(true);
              void checkPaymentStatus(pendingReference);
            }}
            disabled={loading}
          />
          <GivingButton
            label="Start another gift"
            secondary
            onPress={() => {
              setPendingReference(null);
              setPaymentNotice('');
              setError('');
            }}
            disabled={loading}
          />
        </View>
      )}
    </GivingPage>
  );
}
