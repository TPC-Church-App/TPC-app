// apps/mobile/app/(auth)/login.tsx
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { router } from 'expo-router';
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

import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, getPhoneCountryLabel } from '@/constants/countries';
import { colors } from '@/constants/theme';
import { formatPhoneInput } from '@/utils/phone';
import { supabase } from '@/lib/supabase';

type ContactFeedback = { message: string; valid: boolean; };

function getSignInErrorMessage(code?: string) {
  if (code === 'invalid_credentials') return 'Email or password is incorrect.';
  if (code === 'email_not_confirmed') return 'Verify your email using the confirmation message.';
  if (code === 'over_request_rate_limit' || code === 'too_many_requests') return 'Too many attempts. Wait and try again.';
  return 'We could not sign you in. Check your connection.';
}

export default function LoginScreen() {
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<ContactFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  const isPhone = method === 'phone';
  const selectedCountry = PHONE_COUNTRIES.find((item) => item.code === country)!;

  function updateContact(value: string) {
    setFeedback(null);
    if (!isPhone) { setContact(value); return; }
    const formatted = formatPhoneInput(value, country);
    const deletingSeparator = value.length < contact.length && formatted === contact;
    setContact(deletingSeparator ? value : formatted);
  }

  function switchMethod() {
    Keyboard.dismiss();
    setMethod((current) => (current === 'phone' ? 'email' : 'phone'));
    setContact(''); setPassword(''); setFeedback(null); setCountryPickerOpen(false);
  }

  function changeCountry(nextCountry: CountryCode) {
    if (nextCountry === country) return;
    setCountry(nextCountry); setContact(''); setFeedback(null);
  }

  async function validateContact() {
    if (loading) return;
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    if (isPhone) {
      setFeedback({ valid: false, message: 'Phone OTP is not connected. Use email.' });
      return;
    } 

    const trimmed = contact.trim();
    if (!trimmed) return setFeedback({ valid: false, message: 'Enter your email address.' });
    if (!password) return setFeedback({ valid: false, message: 'Enter your password.' });

    setContact(trimmed);
    setFeedback(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) {
        setFeedback({ valid: false, message: getSignInErrorMessage(error.code) });
        setLoading(false);
      } else {
        // Direct navigation without custom loaders
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setFeedback({ valid: false, message: 'Connection problem stopped sign-in. Try again.' });
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>
            {isPhone ? 'Phone OTP is not connected. Switch to email.' : 'Internal alpha access uses email and password.'}
          </Text>

          {isPhone && (
            <>
              <Text style={styles.label}>Country</Text>
              <Pressable onPress={() => setCountryPickerOpen((open) => !open)} style={styles.countryButton}>
                <Text style={styles.countryText}>{getPhoneCountryLabel(selectedCountry)}</Text>
                <Text style={styles.countryAction}>{countryPickerOpen ? 'Close' : 'Change'}</Text>
              </Pressable>
              {countryPickerOpen && (
                <View style={styles.pickerPanel}>
                  <Picker selectedValue={country} onValueChange={changeCountry} style={styles.picker} itemStyle={styles.pickerItem}>
                    {PHONE_COUNTRIES.map((item) => (<Picker.Item key={item.code} label={getPhoneCountryLabel(item)} value={item.code} />))}
                  </Picker>
                  <Pressable onPress={() => setCountryPickerOpen(false)} style={styles.pickerDoneButton}>
                    <Text style={styles.linkText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <Text style={styles.label}>{isPhone ? 'Phone number' : 'Email address'}</Text>
          <TextInput
            key={method}
            style={[styles.input, feedback?.valid === false && styles.inputError]}
            value={contact}
            onChangeText={updateContact}
            placeholder={isPhone ? 'Phone number' : 'you@example.com'}
            keyboardType={isPhone ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!isPhone && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <TextInput
                style={[styles.input, feedback?.valid === false && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          <Pressable onPress={switchMethod} style={styles.switchButton}>
            <Text style={styles.linkText}>{isPhone ? 'Use email instead' : 'Use phone instead'}</Text>
          </Pressable>

          <Pressable onPress={validateContact} disabled={loading} style={styles.enterButton}>
            <Text style={styles.enterButtonText}>{loading ? 'Signing in...' : 'Enter'}</Text>
          </Pressable>

          {feedback && (
            <Text style={[styles.feedback, !feedback.valid && styles.errorText]}>{feedback.message}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 24, color: colors.secondaryText, marginBottom: 32 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  countryButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 24 },
  countryText: { flex: 1, fontSize: 16, color: colors.text },
  countryAction: { fontSize: 14, fontWeight: '600', color: colors.link },
  pickerPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  picker: { width: '100%', color: colors.text },
  pickerItem: { fontSize: 18, color: colors.text },
  pickerDoneButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.decorativeBorder },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontSize: 16 },
  inputError: { borderColor: colors.error },
  switchButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingVertical: 12, marginTop: 16 },
  linkText: { fontSize: 16, fontWeight: '600', color: colors.link },
  enterButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, marginTop: 16 },
  enterButtonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  feedback: { marginTop: 12, fontSize: 14, lineHeight: 21, color: colors.secondaryText },
  errorText: { color: colors.error },
});