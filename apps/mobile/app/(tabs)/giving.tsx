// apps/mobile/app/(tabs)/giving.tsx
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Keyboard, Text, TextInput, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Picker } from '@react-native-picker/picker';
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
  const [fundId, setFundId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFunds() {
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('is_active', true);
        
      if (data) {
        setFunds(data);
        if (data.length > 0) setFundId(data[0].id);
      }
      if (error) console.error("Error fetching funds:", error);
    }
    fetchFunds();
  }, []);

  async function handleGive() {
    Keyboard.dismiss();
    if (!fundId) return setError('Choose a giving category.');
    
    const result = parseGivingAmount(amount);
    if (!result.valid) return setError(result.message);

    if (result.amountMinor < 50000) {
      return setError('Minimum offering is ₦500.');
    }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('offerings-initialize', {
        body: { amount: result.amountMinor / 100, fund_id: fundId },
      });

      if (error) throw error;
      
      if (data?.checkout_url) {
        // Open Paystack and wait for the user to return via the deep link (tpc://)
        const browserResult = await WebBrowser.openAuthSessionAsync(data.checkout_url, 'tpc://');
        
        if (browserResult.type === 'success') {
          // Add a 2-second delay to allow Paystack's webhook to reach our database
          setError('Verifying payment...');
          setTimeout(async () => {
            const verify = await supabase.functions.invoke('offerings-verify', {
              body: { reference: data.reference }
            });
            
            if (verify.data?.status === 'successful') {
               Alert.alert("Success", "Your offering was received!");
            } else {
               Alert.alert("Processing", "Your payment is being processed. It will show in History shortly.");
            }
            router.navigate('/(tabs)/history');
            setError('');
          }, 2500); // 2.5 seconds delay
        } else {
          // User cancelled the browser
          router.navigate('/(tabs)/history');
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

      <View style={ui.card}>
        <Text style={ui.label}>Select Giving Category</Text>
        
        <View style={{ 
          borderWidth: 1, 
          borderColor: colors.border, 
          borderRadius: 12, 
          backgroundColor: colors.surface,
          marginBottom: 16,
          overflow: 'hidden'
        }}>
          <Picker
            selectedValue={fundId}
            onValueChange={(itemValue) => {
              setFundId(itemValue);
              setError('');
            }}
            style={{ color: colors.text }}
          >
            {funds.map((fund) => (
              <Picker.Item key={fund.id} label={fund.name} value={fund.id} />
            ))}
          </Picker>
        </View>

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