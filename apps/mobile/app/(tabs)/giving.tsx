// apps/mobile/app/(tabs)/giving.tsx
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Keyboard, Pressable, Text, TextInput, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';
import {
  GivingButton,
  GivingPage,
  givingStyles as ui,
} from '@/components/giving-ui';
import { parseGivingAmount } from '@/utils/giving';

export default function GivingScreen() {
  const [funds, setFunds] = useState<any[]>([]);
  const [fundId, setFundId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFunds() {
      const { data, error } = await supabase.from('funds').select('*');
      if (data) setFunds(data);
      if (error) console.error("Error fetching funds:", error);
    }
    fetchFunds();
  }, []);

  async function handleGive() {
    Keyboard.dismiss();
    const fund = funds.find((f) => f.id === fundId);
    if (!fund) return setError('Choose a giving category.');
    
    const result = parseGivingAmount(amount);
    if (!result.valid) return setError(result.message);

    // Enforce ₦500 minimum (50,000 kobo)
    if (result.amountMinor < 50000) {
      return setError('Minimum offering is ₦500.');
    }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('offerings-initialize', {
        body: { amount: result.amountMinor / 100, fund_id: fund.id },
      });

      if (error) throw error;
      
      if (data?.checkout_url) {
        const browserResult = await WebBrowser.openBrowserAsync(data.checkout_url);
        
        if (browserResult.type === 'dismiss' || browserResult.type === 'opened') {
          const verify = await supabase.functions.invoke('offerings-verify', {
            body: { reference: data.reference }
          });
          
          if (verify.data?.status === 'successful') {
             Alert.alert("Success", "Your offering was received!");
             router.navigate('/(tabs)/history');
          } else {
             Alert.alert("Pending", "We are verifying your payment. It will appear in your history soon.");
             router.navigate('/(tabs)/history');
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Could not start payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GivingPage title="Give with purpose" subtitle="Choose where your gift will make a difference.">
      <View style={[ui.card, ui.hero]}>
        <Text style={ui.heading}>Every gift has a purpose</Text>
        <Text style={ui.heroBody}>Support worship, church projects and care for our community.</Text>
      </View>

      <Text accessibilityRole="header" style={ui.heading}>Choose your giving</Text>
      <View accessibilityRole="radiogroup" style={ui.stack}>
        {funds.map((fund) => {
          const selected = fundId === fund.id;
          return (
            <Pressable
              key={fund.id}
              onPress={() => { setFundId(fund.id); setError(''); }}
              style={({ pressed }) => [ui.card, selected && ui.selected, pressed && ui.pressed]}
            >
              <View style={ui.row}>
                <Text style={ui.heading}>{fund.name}</Text>
                {selected && <Text style={ui.link}>Selected</Text>}
              </View>
              <Text style={ui.body}>{fund.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={ui.card}>
        <Text style={ui.label}>Amount (NGN)</Text>
        <TextInput
          style={ui.input}
          value={amount}
          onChangeText={(val) => { setAmount(val); setError(''); }}
          placeholder="For example, 1000"
          placeholderTextColor={colors.secondaryText}
          keyboardType="decimal-pad"
        />
        <Text style={ui.caption}>Enter ₦500–₦1,000,000.</Text>
        
        {error !== '' && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
        
        <GivingButton 
          label={loading ? "Processing..." : "Proceed to Pay"} 
          onPress={handleGive} 
          disabled={loading} 
        />
      </View>
    </GivingPage>
  );
}