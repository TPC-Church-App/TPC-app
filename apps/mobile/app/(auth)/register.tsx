// ===============================================================
// File: apps/mobile/app/(auth)/register.tsx
// Description: Two-step Create Account flow with structured names & OS autofill.
// Author: Josiah Ewumi
// ===============================================================

import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import type { CountryCode } from 'libphonenumber-js';
import {
  Calendar,
  ChevronLeft,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandedLoader from '@/components/branded-loader';
import BrandBackdrop from '@/components/ui/brand-backdrop';
import GoldButton from '@/components/ui/gold-button';
import IconInput from '@/components/ui/icon-input';
import SocialAuthRow from '@/components/ui/social-auth-row';
import SurfaceCard from '@/components/ui/surface-card';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  getPhoneCountryLabel,
} from '@/constants/countries';
import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMemberDraft } from '@/store/member-draft';
import { formatPhoneInput, validatePhoneInput } from '@/utils/phone';

export default function RegisterScreen() {
  const { updateDraft } = useMemberDraft();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields (structured names + email + password)
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 fields (Country, Phone Number, Age, Address)
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry = PHONE_COUNTRIES.find(
    (item) => item.code === country,
  )!;

  function updatePhone(value: string) {
    const formatted = formatPhoneInput(value, country);
    const deletingSeparator =
      value.length < phone.length && formatted === phone;
    setPhone(deletingSeparator ? value : formatted);
    setError('');
  }

  function handleStep1Continue() {
    Keyboard.dismiss();
    const tFirst = firstName.trim();
    const tMiddle = middleName.trim();
    const tSurname = surname.trim();
    const cleanedEmail = email.trim();

    if (!tFirst) {
      setError('Enter your first name.');
      return;
    }
    if (!tSurname) {
      setError('Enter your surname.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setFirstName(tFirst);
    setMiddleName(tMiddle);
    setSurname(tSurname);
    setEmail(cleanedEmail);
    setError('');
    setStep(2);
  }

  async function handleRegister() {
    if (loading) return;
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    const phoneResult = validatePhoneInput(phone, country);
    if (!phoneResult.valid) {
      setError(phoneResult.message);
      return;
    }

    if (!/^\d+$/.test(age.trim())) {
      setError('Age must be a whole number.');
      return;
    }
    const parsedAge = parseInt(age.trim(), 10);
    if (parsedAge < 4) {
      setError('You must be at least 4 years old to register.');
      return;
    }

    const cleanedAddress = address.trim();
    if (cleanedAddress.length < 3) {
      setError('Enter your residential address.');
      return;
    }

    const tFirst = firstName.trim();
    const tMiddle = middleName.trim();
    const tSurname = surname.trim();
    const fullName = [tFirst, tMiddle, tSurname].filter(Boolean).join(' ');

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: tFirst,
            middle_name: tMiddle || null,
            surname: tSurname,
            full_name: fullName,
            phone: phoneResult.displayNumber,
            age: parsedAge.toString(),
            address: cleanedAddress,
          },
        },
      });

      if (signUpError) throw signUpError;

      updateDraft({
        firstName: tFirst,
        surname: tSurname,
        age: parsedAge.toString(),
      });

      if (data.session) {
        setLoading(false);
        router.replace('/(tabs)/home');
      } else {
        setLoading(false);
        Alert.alert(
          'Registration successful',
          'Please check your email to verify your account, then sign in.',
          [{ text: 'OK', onPress: () => router.push('/(auth)/login') }],
        );
      }
    } catch {
      setError('Registration failed. Please check your details and try again.');
      setLoading(false);
    }
  }

  function handleBack() {
    setError('');
    if (step === 2) {
      setStep(1);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <BrandBackdrop>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Floating Circular Back Button */}
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={step === 2 ? 'Back to step 1' : 'Go back'}
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.backBtn,
                  shadows.card,
                  pressed && styles.pressed,
                ]}
              >
                <ChevronLeft
                  size={20}
                  color={palette.textPrimary}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>

            {/* Centered TPC Emblem & Wordmark */}
            <View style={styles.brandBlock}>
              <Image
                source={require('../../assets/light/church-logo-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="The Pentecostal Congregation logo"
              />
              <Text style={styles.churchName}>
                The Pentecostal{'\n'}Congregation
              </Text>
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              {step === 1 ? 'Create Account' : 'Complete Details'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Join our church community'
                : 'Step 2 of 2 • Contact, Age & Address'}
            </Text>

            {step === 1 ? (
              <View style={styles.form}>
                <IconInput
                  accessibilityLabel="First Name"
                  icon={
                    <User
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={firstName}
                  onChangeText={(v) => {
                    setError('');
                    setFirstName(v);
                  }}
                  placeholder="First Name"
                  textContentType="givenName"
                  autoComplete="name-given"
                  autoCapitalize="words"
                />

                <IconInput
                  accessibilityLabel="Middle Name (Optional)"
                  icon={
                    <User
                      size={19}
                      color={palette.textMuted}
                      strokeWidth={1.75}
                    />
                  }
                  value={middleName}
                  onChangeText={(v) => {
                    setError('');
                    setMiddleName(v);
                  }}
                  placeholder="Middle Name (Optional)"
                  textContentType="middleName"
                  autoComplete="name-middle"
                  autoCapitalize="words"
                />

                <IconInput
                  accessibilityLabel="Surname"
                  icon={
                    <User
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={surname}
                  onChangeText={(v) => {
                    setError('');
                    setSurname(v);
                  }}
                  placeholder="Surname"
                  textContentType="familyName"
                  autoComplete="name-family"
                  autoCapitalize="words"
                />

                <IconInput
                  accessibilityLabel="Email Address"
                  icon={
                    <Mail
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={email}
                  onChangeText={(v) => {
                    setError('');
                    setEmail(v);
                  }}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <IconInput
                  accessibilityLabel="Password"
                  icon={
                    <Lock
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={password}
                  onChangeText={(v) => {
                    setError('');
                    setPassword(v);
                  }}
                  placeholder="Password"
                  secureToggle
                  textContentType="newPassword"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={handleStep1Continue}
                />

                {error !== '' && (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {error}
                  </Text>
                )}

                <GoldButton
                  label="Sign Up"
                  onPress={handleStep1Continue}
                  style={{ marginTop: 6 }}
                />

                <View style={styles.inlinePrompt}>
                  <Text style={styles.promptMuted}>
                    Already have an account?{' '}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/(auth)/login')}
                  >
                    <Text style={styles.promptGold}>Sign In</Text>
                  </Pressable>
                </View>

                <SocialAuthRow
                  variant="compact"
                  dividerLabel="Or continue with"
                  onNotice={(msg) => setError(msg)}
                />

                <Text style={styles.legalText}>
                  By signing up, you agree to our{'\n'}
                  <Text style={styles.legalGold}>
                    Terms of Service
                  </Text> and{' '}
                  <Text style={styles.legalGold}>Privacy Policy</Text>
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: countryPickerOpen }}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCountryPickerOpen((open) => !open);
                  }}
                  style={[styles.countryPill, shadows.card]}
                >
                  <Globe size={19} color={palette.inkNavy} strokeWidth={1.75} />
                  <Text style={styles.countryText} numberOfLines={1}>
                    {getPhoneCountryLabel(selectedCountry)}
                  </Text>
                  <Text style={styles.countryAction}>
                    {countryPickerOpen ? 'Done' : 'Change'}
                  </Text>
                </Pressable>

                {countryPickerOpen && (
                  <SurfaceCard style={styles.pickerPanel}>
                    <Picker
                      selectedValue={country}
                      onValueChange={(nextCountry) => {
                        setCountry(nextCountry);
                        setPhone('');
                        setError('');
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
                  </SurfaceCard>
                )}

                <IconInput
                  accessibilityLabel="Phone Number"
                  icon={
                    <Phone
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={phone}
                  onChangeText={updatePhone}
                  placeholder={
                    country === 'NG' ? '0701 234 5678' : 'Phone Number'
                  }
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                />

                <IconInput
                  accessibilityLabel="Age"
                  icon={
                    <Calendar
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={age}
                  onChangeText={(v) => {
                    setError('');
                    setAge(v);
                  }}
                  placeholder="Age (4 or above)"
                  keyboardType="number-pad"
                  textContentType="none"
                  autoComplete="off"
                  maxLength={3}
                />

                <IconInput
                  accessibilityLabel="Address"
                  icon={
                    <MapPin
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  }
                  value={address}
                  onChangeText={(v) => {
                    setError('');
                    setAddress(v);
                  }}
                  placeholder="Residential Address"
                  textContentType="fullStreetAddress"
                  autoComplete="street-address"
                  autoCapitalize="words"
                />

                {error !== '' && (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {error}
                  </Text>
                )}

                <GoldButton
                  label="Create Account"
                  loading={loading}
                  onPress={() => void handleRegister()}
                  style={{ marginTop: 6 }}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={handleBack}
                  style={styles.secondaryBack}
                >
                  <Text style={styles.promptGold}>
                    Edit Name, Email or Password
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <BrandedLoader visible={loading} label="Creating your account…" />
      </SafeAreaView>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  topBar: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 100,
    height: 72,
  },
  churchName: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    color: palette.inkNavy,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
    color: palette.inkNavy,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  form: {
    gap: 12,
  },
  countryPill: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: palette.borderInput,
    borderRadius: radii.pill,
  },
  countryText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.textPrimary,
  },
  countryAction: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: palette.goldText,
  },
  pickerPanel: {
    overflow: 'hidden',
  },
  picker: { width: '100%', color: palette.textPrimary },
  pickerItem: { fontSize: 17, color: palette.textPrimary },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.error,
  },
  inlinePrompt: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptMuted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
  },
  promptGold: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.goldText,
  },
  legalText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  legalGold: {
    fontFamily: fonts.semiBold,
    color: palette.goldText,
  },
  secondaryBack: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.72,
  },
});
