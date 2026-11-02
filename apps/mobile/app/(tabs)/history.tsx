// apps/mobile/app/(tabs)/history.tsx
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  GivingPage,
  GivingButton,
  givingStyles as ui,
} from '@/components/giving-ui';
import { formatGivingAmount, formatGivingDate } from '@/utils/giving';

export default function HistoryScreen() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      // Fetch the user's offerings from Supabase
      const { data, error } = await supabase
        .from('offerings')
        .select('*, funds(name)') // Join with the funds table to get the name
        .order('created_at', { ascending: false });

      if (data) setOfferings(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <GivingPage title="Payment history" subtitle="See the purpose, amount and outcome of each gift.">
      <GivingButton label="Make a gift" onPress={() => router.navigate('/(tabs)/giving')} />
      
      {loading && <Text style={ui.body}>Loading history...</Text>}

      {!loading && offerings.length === 0 && (
        <View style={ui.card}>
          <Text style={ui.heading}>No giving history yet</Text>
          <Text style={ui.body}>Your giving records will appear here after your first offering.</Text>
        </View>
      )}

      {offerings.map((p) => (
        <View key={p.id} style={ui.card}>
          <Text style={ui.heading}>{p.funds?.name || 'Offering'}</Text>
          <Text style={ui.amount}>{formatGivingAmount(p.amount * 100)}</Text>
          <Text style={ui.label}>{p.status.toUpperCase()}</Text>
          <Text style={ui.caption}>{formatGivingDate(p.created_at)}</Text>
          <Text selectable style={ui.caption}>Ref: {p.reference}</Text>
        </View>
      ))}
    </GivingPage>
  );
}