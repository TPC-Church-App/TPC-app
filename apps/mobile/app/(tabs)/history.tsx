// ===============================================================
// apps/mobile/app/(tabs)/history.tsx
// Load and display the member's giving history.
// ===============================================================
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  GivingPage,
  GivingButton,
  givingStyles as ui,
} from '@/components/giving-ui';
import { formatGivingAmount, formatGivingDate } from '@/utils/giving';

// ===============================================================
// GIVING HISTORY STATE AND QUERY
// ===============================================================

export default function HistoryScreen() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ===============================================================
  // LOAD GIVING HISTORY
  // ===============================================================

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('offerings')
        .select('*, funds(name)')
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(
          'Payment history could not load. Check your connection and retry.',
        );
      } else {
        setOfferings(data ?? []);
        setError('');
      }
    } catch {
      setError(
        'Payment history could not load. Check your connection and retry.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchHistory();
    }, [fetchHistory]),
  );

  // ===============================================================
  // HISTORY INTERFACE
  // ===============================================================

  return (
    <GivingPage
      title="Payment history"
      subtitle="See the purpose, amount and outcome of each gift."
    >
      <GivingButton
        label="Make a gift"
        onPress={() => router.navigate('/(tabs)/giving')}
      />

      {loading && <Text style={ui.body}>Loading history...</Text>}

      {error !== '' && (
        <View style={ui.card}>
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
          <GivingButton
            label="Retry loading history"
            secondary
            onPress={() => void fetchHistory()}
          />
        </View>
      )}

      {!loading && error === '' && offerings.length === 0 && (
        <View style={ui.card}>
          <Text style={ui.heading}>No giving history yet</Text>
          <Text style={ui.body}>
            Your giving records will appear here after your first offering.
          </Text>
        </View>
      )}

      {offerings.map((p) => (
        <View key={p.id} style={ui.card}>
          <Text style={ui.heading}>{p.funds?.name || 'Offering'}</Text>
          <Text style={ui.amount}>{formatGivingAmount(p.amount * 100)}</Text>
          <Text style={ui.label}>{p.status.toUpperCase()}</Text>
          <Text style={ui.caption}>{formatGivingDate(p.created_at)}</Text>
          <Text selectable style={ui.caption}>
            Ref: {p.reference}
          </Text>
        </View>
      ))}
    </GivingPage>
  );
}
