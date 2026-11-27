// ===============================================================
// File: apps/mobile/app/(auth)/login.tsx
// Description: Welcome Back sign-in screen matching Image 4.
// Author: Josiah Ewumi
// ===============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import type { CountryCode } from 'libphonenumber-js';
import {
  Check,
  ChevronLeft,
  Globe,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { formatPhoneInput } from '@/utils/phone';

type ContactFeedback = { message: string; valid: boolean };

function getSignInErrorMessage(code?: string) {
  if (code === 'invalid_credentials') return 'Email or password is incorrect.';
  if (code === 'email_not_confirmed')
    return 'Verify your email using the confirmation message.';
  if (code === 'over_request_rate_limit' || code === 'too_many_requests')
    return 'Too many attempts. Wait and try again.';
  return 'We could not sign you in. Check your connection.';
}

export default function LoginScreen() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<ContactFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<ContactFeedback | null>(
    null,
  );

  useEffect(() => {
    void AsyncStorage.getItem('tpc.remember_me')
      .then((val) => {
        if (val === 'false') setRememberMe(false);
      })
      .catch(() => {});
  }, []);

  const isPhone = method === 'phone';
  const selectedCountry = PHONE_COUNTRIES.find(
    (item) => item.code === country,
  )!;

  function updateContact(value: string) {
    setFeedback(null);
    if (!isPhone) {
      setContact(value);
      return;
    }
    const formatted = formatPhoneInput(value, country);
    const deletingSeparator =
      value.length < contact.length && formatted === contact;
    setContact(deletingSeparator ? value : formatted);
  }

  function switchMethod() {
    Keyboard.dismiss();
    setMethod((current) => (current === 'phone' ? 'email' : 'phone'));
    setContact('');
    setPassword('');
    setFeedback(null);
    setCountryPickerOpen(false);
  }

  function changeCountry(nextCountry: CountryCode) {
    if (nextCountry === country) return;
    setCountry(nextCountry);
    setContact('');
    setFeedback(null);
  }

  async function toggleRememberMe() {
    const next = !rememberMe;
    setRememberMe(next);
    try {
      await AsyncStorage.setItem('tpc.remember_me', next ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
  }

  async function handleLogin() {
    if (loading) return;
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    if (isPhone) {
      setFeedback({
        valid: false,
        message: 'Phone OTP is not connected yet. Please sign in with email.',
      });
      return;
    }

    const trimmed = contact.trim();
    if (!trimmed) {
      setFeedback({ valid: false, message: 'Enter your email address.' });
      return;
    }
    if (!password) {
      setFeedback({ valid: false, message: 'Enter your password.' });
      return;
    }

    setContact(trimmed);
    setFeedback(null);
    setLoading(true);

    try {
      await AsyncStorage.setItem(
        'tpc.remember_me',
        rememberMe ? 'true' : 'false',
      ).catch(() => {});

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) {
        setFeedback({
          valid: false,
          message: getSignInErrorMessage(error.code),
        });
        setLoading(false);
      } else {
        setLoading(false);
        router.replace('/(tabs)/home');
      }
    } catch {
      setFeedback({
        valid: false,
        message: 'Connection problem stopped sign-in. Try again.',
      });
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (resetBusy) return;
    const trimmed = resetEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setResetFeedback({
        valid: false,
        message: 'Enter a valid email address.',
      });
      return;
    }

    setResetBusy(true);
    setResetFeedback(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) {
        setResetFeedback({
          valid: false,
          message: 'Could not send reset email right now. Try again shortly.',
        });
      } else {
        setResetFeedback({
          valid: true,
          message:
            'If an account exists for that email, a reset link has been sent.',
        });
      }
    } catch {
      setResetFeedback({
        valid: false,
        message: 'Connection error while requesting reset link.',
      });
    } finally {
      setResetBusy(false);
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
            {/* Top Back Button */}
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace('/')
                }
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

            {/* Centered Emblem & Wordmark */}
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
              Welcome Back
            </Text>
            <Text style={styles.subtitle}>
              {isPhone
                ? 'Phone OTP is pending; use email to sign in'
                : 'Sign in to continue'}
            </Text>

            <View style={styles.form}>
              {isPhone && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCountryPickerOpen((open) => !open)}
                    style={[styles.countryPill, shadows.card]}
                  >
                    <Globe
                      size={18}
                      color={palette.textSecondary}
                      strokeWidth={1.8}
                    />
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
                        onValueChange={changeCountry}
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
                </>
              )}

              <IconInput
                key={`contact-${method}`}
                accessibilityLabel={isPhone ? 'Phone number' : 'Email Address'}
                icon={
                  isPhone ? (
                    <Phone
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  ) : (
                    <User
                      size={19}
                      color={palette.inkNavy}
                      strokeWidth={1.75}
                    />
                  )
                }
                value={contact}
                onChangeText={updateContact}
                placeholder={isPhone ? 'Phone Number' : 'Email Address'}
                keyboardType={isPhone ? 'phone-pad' : 'email-address'}
                textContentType={isPhone ? 'telephoneNumber' : 'emailAddress'}
                autoComplete={isPhone ? 'tel' : 'email'}
                autoCapitalize="none"
                autoCorrect={false}
                error={feedback?.valid === false}
              />

              {!isPhone && (
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
                    setFeedback(null);
                    setPassword(v);
                  }}
                  placeholder="Password"
                  secureToggle
                  textContentType="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  error={feedback?.valid === false}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleLogin()}
                />
              )}

              {/* Remember Me + Forgot Password Row */}
              <View style={styles.optionsRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => void toggleRememberMe()}
                  style={styles.rememberRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Check
                        size={13}
                        color={palette.surface}
                        strokeWidth={2.8}
                      />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setResetEmail(isPhone ? '' : contact.trim());
                    setResetFeedback(null);
                    setResetOpen(true);
                  }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </View>

              {feedback && (
                <Text
                  accessibilityRole={feedback.valid ? 'text' : 'alert'}
                  style={[styles.feedback, !feedback.valid && styles.errorText]}
                >
                  {feedback.message}
                </Text>
              )}

              <GoldButton
                label="Login"
                onPress={() => void handleLogin()}
                loading={loading}
                style={{ marginTop: 6 }}
              />

              <SocialAuthRow
                variant="continue"
                dividerLabel="Or"
                onNotice={(msg) =>
                  setFeedback(msg ? { valid: false, message: msg } : null)
                }
              />

              <View style={styles.footerPrompt}>
                <Text style={styles.footerMuted}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={styles.footerGold}>Sign Up</Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={switchMethod}
                style={styles.methodLinkWrap}
              >
                <Text style={styles.methodLink}>
                  {isPhone
                    ? 'Sign in with Email instead'
                    : 'Use Phone number instead'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Password Reset Modal */}
        <Modal
          visible={resetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setResetOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <SurfaceCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close password reset"
                  onPress={() => setResetOpen(false)}
                >
                  <X size={20} color={palette.textSecondary} />
                </Pressable>
              </View>
              <Text style={styles.modalDesc}>
                Enter your registered email address and we&apos;ll send you a
                password reset link.
              </Text>
              <IconInput
                accessibilityLabel="Reset email address"
                icon={
                  <Mail size={19} color={palette.inkNavy} strokeWidth={1.75} />
                }
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {resetFeedback && (
                <Text
                  style={[
                    styles.feedback,
                    resetFeedback.valid ? styles.successText : styles.errorText,
                    { marginTop: 10 },
                  ]}
                >
                  {resetFeedback.message}
                </Text>
              )}
              <GoldButton
                label="Send Reset Link"
                loading={resetBusy}
                onPress={() => void handlePasswordReset()}
                style={{ marginTop: 16 }}
              />
            </SurfaceCard>
          </View>
        </Modal>

        <BrandedLoader visible={loading} label="Signing you in…" />
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
    marginBottom: 18,
  },
  logo: {
    width: 108,
    height: 78,
  },
  churchName: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 14.5,
    lineHeight: 19,
    textAlign: 'center',
    color: palette.inkNavy,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 29,
    lineHeight: 35,
    textAlign: 'center',
    color: palette.inkNavy,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  form: {
    gap: 14,
  },
  countryPill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: palette.borderInput,
    borderRadius: radii.pill,
  },
  countryText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: palette.borderInput,
    backgroundColor: palette.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: palette.gold,
    borderColor: palette.gold,
  },
  rememberText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: palette.textPrimary,
  },
  forgotText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: palette.goldText,
  },
  feedback: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
  },
  successText: {
    color: colors.success,
  },
  footerPrompt: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerMuted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: palette.textPrimary,
  },
  footerGold: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.goldText,
  },
  methodLinkWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  methodLink: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: palette.textSecondary,
  },
  pressed: {
    opacity: 0.72,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: palette.textPrimary,
  },
  modalDesc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    marginBottom: 16,
  },
});
