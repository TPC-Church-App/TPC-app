// apps/mobile/app/(auth)/register.tsx
// ===============================================================
// Collect member details before phone/email verification.
// ===============================================================

import { router } from 'expo-router';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import type { CountryCode } from 'libphonenumber-js';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  getPhoneCountryLabel,
} from '@/constants/countries';
import { formatPhoneInput, validatePhoneInput } from '@/utils/phone';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry = PHONE_COUNTRIES.find((item) => item.code === country)!;

  function updatePhone(value: string) {
    const formatted = formatPhoneInput(value, country);
    const deletingSeparator = value.length < phone.length && formatted === phone;
    setPhone(deletingSeparator ? value : formatted);
    setError('');
  }

  // ===============================================================
  // REQUIRED MEMBER DETAILS
  // ===============================================================
  async function handleRegister() {
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    const tFirst = firstName.trim();
    const tSurname = surname.trim();
    const tEmail = email.trim();
    
    if (!tFirst || !tSurname) return setError('First name and surname are required.');
    
    // Strict age validation (no decimals, no letters)
    if (!/^\d+$/.test(age.trim())) return setError('Age must be a whole number.');
    const tAge = parseInt(age.trim(), 10);
    if (tAge < 4) return setError('You must be at least 4 years old to register.');

    // Phone validation using Ire's utility
    const phoneResult = validatePhoneInput(phone, country);
    if (!phoneResult.valid) return setError(phoneResult.message);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tEmail)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: tEmail,
        password: password,
        options: {
          data: {
            full_name: `${tFirst} ${tSurname}`,
            phone: phoneResult.displayNumber,
            age: tAge.toString(),
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // Auto-login successful
        router.replace('/(tabs)/home');
      } else {
        // Email confirmation is required
        alert('Registration successful! Please check your email to verify your account.');
        router.push('/(auth)/login');
      }
    } catch (err: any) {
      // Mask raw server errors from the user and console
      setError('Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>Create an account</Text>
          <Text style={styles.description}>Join the TPC community today.</Text>

          <Text style={styles.label}>First name</Text>
          <TextInput accessibilityLabel="First name" style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.secondaryText} />

          <Text style={styles.label}>Surname</Text>
          <TextInput accessibilityLabel="Surname" style={styles.input} value={surname} onChangeText={setSurname} placeholder="Surname" placeholderTextColor={colors.secondaryText} />

          <Text style={styles.label}>Country</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: countryPickerOpen }} onPress={() => { Keyboard.dismiss(); setCountryPickerOpen((o) => !o); }} style={styles.countryButton}>
            <Text style={styles.countryText}>{getPhoneCountryLabel(selectedCountry)}</Text>
            <Text style={styles.countryAction}>{countryPickerOpen ? 'Close' : 'Change'}</Text>
          </Pressable>

          {countryPickerOpen && (
            <View style={styles.pickerPanel}>
              <Picker selectedValue={country} onValueChange={(c) => { setCountry(c); setPhone(''); }} style={styles.picker} itemStyle={styles.pickerItem}>
                {PHONE_COUNTRIES.map((item) => (<Picker.Item key={item.code} label={getPhoneCountryLabel(item)} value={item.code} />))}
              </Picker>
              <Pressable accessibilityRole="button" onPress={() => setCountryPickerOpen(false)} style={styles.pickerDoneButton}><Text style={styles.linkText}>Done</Text></Pressable>
            </View>
          )}

          <Text style={styles.label}>Phone number</Text>
          <TextInput accessibilityLabel="Phone number" style={styles.input} value={phone} onChangeText={updatePhone} placeholder={country === 'NG' ? '0701 234 5678' : 'Phone number'} keyboardType="phone-pad" placeholderTextColor={colors.secondaryText} />

          <Text style={styles.label}>Age</Text>
          <TextInput accessibilityLabel="Age" style={styles.input} value={age} onChangeText={setAge} placeholder="Age in years — 4 or above" keyboardType="number-pad" maxLength={3} placeholderTextColor={colors.secondaryText} />

          <Text style={styles.label}>Email address</Text>
          <TextInput accessibilityLabel="Email address" style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.secondaryText} />

          <Text style={styles.label}>Password</Text>
          <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} placeholder="Create a password (min 6 chars)" secureTextEntry autoCapitalize="none" placeholderTextColor={colors.secondaryText} />

          {error !== '' && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}

          <Pressable accessibilityRole="button" onPress={handleRegister} disabled={loading} style={styles.button}>
            <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')} style={styles.switchButton}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  description: { fontSize: 16, color: colors.secondaryText, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  countryButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 24 },
  countryText: { flex: 1, fontSize: 16, color: colors.text },
  countryAction: { fontSize: 14, fontWeight: '600', color: colors.link },
  pickerPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  picker: { width: '100%', color: colors.text },
  pickerItem: { fontSize: 18, color: colors.text },
  pickerDoneButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.decorativeBorder },
  linkText: { fontSize: 16, fontWeight: '600', color: colors.link },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 12 },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, marginTop: 8 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  switchButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
});