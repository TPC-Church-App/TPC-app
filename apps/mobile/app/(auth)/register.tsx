// ===============================================================
// apps/mobile/app/(auth)/register.tsx
// Collect member details and create an account with Supabase Auth.
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
  getPhoneCountryLabel,
  PHONE_COUNTRIES,
} from '@/constants/countries';
import { formatPhoneInput, validatePhoneInput } from '@/utils/phone';
import { profileError } from '@/utils/member-demo';

// ===============================================================
// REGISTRATION STATE AND SUBMISSION
// ===============================================================

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
  const [notice, setNotice] = useState('');
  const selectedCountry = PHONE_COUNTRIES.find(
    (item) => item.code === country,
  )!;

  // ===============================================================
  // VALIDATE AND SUBMIT REGISTRATION
  // ===============================================================

    async function handleRegister() {
    Keyboard.dismiss();
    if (!firstName || !surname || !phone || !age || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${surname.trim()}`,
            phone: phone.trim(),
            age: age.trim(),
          },
        },
      });

      if (error) throw error;

      // Force navigation to home. If auto-login is on, it works.
      // If email confirmation is still somehow on, we log them in manually for the demo.
      if (!data.session) {
        // This is a fallback for the demo just in case Supabase settings didn't save
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (signInError) throw signInError;
      }
      
      router.replace('/(tabs)/home');

    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  // ===============================================================
  // REGISTRATION INTERFACE
  // ===============================================================

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" style={styles.title}>
            Create an account
          </Text>
          <Text style={styles.description}>
            Join the TPC community today. Email and password access is temporary
            for this internal alpha; your phone number is collected but not
            verified because phone OTP is not connected yet.
          </Text>

          {notice !== '' && (
            <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
              {notice}
            </Text>
          )}

          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            accessibilityLabel="First name"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Surname"
            accessibilityLabel="Surname"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Country</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Phone country: ${getPhoneCountryLabel(selectedCountry)}`}
            onPress={() => setCountryPickerOpen((open) => !open)}
            style={styles.countryButton}
          >
            <Text style={styles.countryText}>
              {getPhoneCountryLabel(selectedCountry)}
            </Text>
            <Text style={styles.linkText}>
              {countryPickerOpen ? 'Close' : 'Change'}
            </Text>
          </Pressable>
          {countryPickerOpen && (
            <View style={styles.pickerPanel}>
              <Picker
                selectedValue={country}
                onValueChange={(value) => {
                  setCountry(value as CountryCode);
                  setPhone('');
                }}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {PHONE_COUNTRIES.map((item) => (
                  <Picker.Item
                    key={item.code}
                    label={getPhoneCountryLabel(item)}
                    value={item.code}
                  />
                ))}
              </Picker>
              <Pressable
                onPress={() => setCountryPickerOpen(false)}
                style={styles.pickerDoneButton}
              >
                <Text style={styles.linkText}>Done</Text>
              </Pressable>
            </View>
          )}
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(value) => setPhone(formatPhoneInput(value, country))}
            placeholder="e.g. 080 1234 5678"
            keyboardType="phone-pad"
            autoComplete="tel"
            accessibilityLabel="Phone number"
            placeholderTextColor={colors.secondaryText}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            keyboardType="number-pad"
            maxLength={3}
            placeholderTextColor={colors.secondaryText}
            accessibilityLabel="Age in years"
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.secondaryText}
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password (min 6 chars)"
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={colors.secondaryText}
            accessibilityLabel="Password"
          />

          {error !== '' && (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={styles.switchButton}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===============================================================
// SCREEN STYLES
// ===============================================================

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: { fontSize: 16, color: colors.secondaryText, marginBottom: 24 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  countryButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  countryText: { flexShrink: 1, color: colors.text, fontSize: 16 },
  pickerPanel: {
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: { color: colors.text },
  pickerItem: { color: colors.text },
  pickerDoneButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 12 },
  noticeText: {
    color: colors.success,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  switchButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: { fontSize: 16, fontWeight: '600', color: colors.link },
});
