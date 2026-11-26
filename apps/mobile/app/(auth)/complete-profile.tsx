// ===============================================================
// File: apps/mobile/app/(auth)/complete-profile.tsx
// Description: Post-social sign-in onboarding collecting structured name, phone, age, and address.
// Author: Josiah Ewumi
// ===============================================================

import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import type { CountryCode } from 'libphonenumber-js';
import {
  Calendar,
  ChevronLeft,
  Globe,
  MapPin,
  Phone,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
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

export default function CompleteProfileScreen() {
  const { updateDraft } = useMemberDraft();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active || !data.user) return;
        const meta = data.user.user_metadata ?? {};
        const explicitFirst =
          typeof meta.first_name === 'string' ? meta.first_name.trim() : '';
        const explicitMiddle =
          typeof meta.middle_name === 'string' ? meta.middle_name.trim() : '';
        const explicitSurname =
          typeof meta.surname === 'string' ? meta.surname.trim() : '';

        if (explicitFirst || explicitSurname) {
          setFirstName(explicitFirst);
          setMiddleName(explicitMiddle);
          setSurname(explicitSurname);
        } else {
          const rawName =
            (typeof meta.full_name === 'string' && meta.full_name) ||
            (typeof meta.name === 'string' && meta.name) ||
            '';
          const tokens = rawName.trim().split(/\s+/).filter(Boolean);
          if (tokens.length === 1) {
            setFirstName(tokens[0]);
          } else if (tokens.length === 2) {
            setFirstName(tokens[0]);
            setSurname(tokens[1]);
          } else if (tokens.length >= 3) {
            setFirstName(tokens[0]);
            setMiddleName(tokens.slice(1, -1).join(' '));
            setSurname(tokens[tokens.length - 1]);
          }
        }

        if (typeof meta.age === 'string') setAge(meta.age);
        if (typeof meta.address === 'string') setAddress(meta.address);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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

  async function handleComplete() {
    if (loading) return;
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    const tFirst = firstName.trim();
    const tMiddle = middleName.trim();
    const tSurname = surname.trim();

    if (!tFirst) {
      setError('Enter your first name.');
      return;
    }
    if (!tSurname) {
      setError('Enter your surname.');
      return;
    }

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

    const fullName = [tFirst, tMiddle, tSurname].filter(Boolean).join(' ');
    setLoading(true);
    setError('');

    try {
      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            first_name: tFirst,
            middle_name: tMiddle || null,
            surname: tSurname,
            full_name: fullName,
            phone: phoneResult.displayNumber,
            age: parsedAge.toString(),
            address: cleanedAddress,
          },
        });

      if (updateError) throw updateError;

      const userId = userData.user?.id;
      if (userId) {
        await Promise.allSettled([
          supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId),
          supabase
            .from('members')
            .update({ address: cleanedAddress })
            .eq('user_id', userId),
        ]);
      }

      updateDraft({
        firstName: tFirst,
        surname: tSurname,
        age: parsedAge.toString(),
      });

      setLoading(false);
      router.replace('/(tabs)/home');
    } catch {
      setError('Could not save your details. Check your connection and retry.');
      setLoading(false);
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
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                onPress={() => router.replace('/(auth)/login')}
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
              Finish Your Profile
            </Text>
            <Text style={styles.subtitle}>
              Confirm your name and add your contact details
            </Text>

            <View style={styles.form}>
              <IconInput
                accessibilityLabel="First Name"
                icon={
                  <User size={19} color={palette.inkNavy} strokeWidth={1.75} />
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
                  <User size={19} color={palette.inkNavy} strokeWidth={1.75} />
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
                  <Phone size={19} color={palette.inkNavy} strokeWidth={1.75} />
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
                label="Save & Continue"
                loading={loading}
                onPress={() => void handleComplete()}
                style={{ marginTop: 6 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <BrandedLoader visible={loading} label="Saving your profile…" />
      </SafeAreaView>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  topBar: { alignItems: 'flex-start', marginBottom: 4 },
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
  brandBlock: { alignItems: 'center', marginBottom: 14 },
  logo: { width: 92, height: 66 },
  churchName: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    color: palette.inkNavy,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    color: palette.inkNavy,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  form: { gap: 12 },
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
  pickerPanel: { overflow: 'hidden' },
  picker: { width: '100%', color: palette.textPrimary },
  pickerItem: { fontSize: 17, color: palette.textPrimary },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.error,
  },
  pressed: { opacity: 0.72 },
});
