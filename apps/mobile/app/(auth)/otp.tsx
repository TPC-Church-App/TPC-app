// ===============================================================
// File: apps/mobile/app/(auth)/otp.tsx
// Description: Development verification code preview in Warm Ivory & Gold UI.
// Author: Josiah Ewumi
// ===============================================================

import { router } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  InputAccessoryView,
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

import BrandedLoader from '@/components/branded-loader';
import BrandBackdrop from '@/components/ui/brand-backdrop';
import GoldButton from '@/components/ui/gold-button';
import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';
import { useDemoTransition } from '@/utils/use-demo-transition';

const CODE_LENGTH = 6;
const KEYBOARD_TOOLBAR_ID = 'verification-keyboard-toolbar';

export default function VerificationScreen() {
  const { openDemo } = useMemberDraft();

  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hasError, setHasError] = useState(false);
  const { phase, busy, start } = useDemoTransition();

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
    setFeedback('');
    setHasError(false);
  }

  function submitCode() {
    if (busy) return;

    Keyboard.dismiss();

    if (!__DEV__) {
      setHasError(true);
      setFeedback('Contact verification is not connected in this build.');
      return;
    }

    if (code.length !== CODE_LENGTH) {
      setHasError(true);
      setFeedback(`Enter all ${CODE_LENGTH} digits.`);
      return;
    }

    if (code !== '123456') {
      setHasError(true);
      setFeedback('Incorrect demo code. Use 123456.');
      return;
    }

    setHasError(false);
    setFeedback('');
    start(() => {
      setCode('');
      openDemo();
      router.replace('/(tabs)/home');
    });
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
            keyboardDismissMode="on-drag"
          >
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

            <View style={styles.badge}>
              <ShieldCheck size={16} color={palette.goldIcon} strokeWidth={2} />
              <Text style={styles.badgeText}>Verification Preview</Text>
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              Verify Your Contact
            </Text>

            <Text style={styles.description}>
              {__DEV__
                ? 'Development preview: enter 123456 to open Home. No verification code has been sent.'
                : 'Contact verification is not connected in this build.'}
            </Text>

            <TextInput
              accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
              value={code}
              onChangeText={updateCode}
              style={[styles.input, hasError && styles.inputError]}
              placeholder="000000"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              autoCorrect={false}
              autoCapitalize="none"
              inputAccessoryViewID={
                Platform.OS === 'ios' ? KEYBOARD_TOOLBAR_ID : undefined
              }
              returnKeyType="done"
              onSubmitEditing={submitCode}
            />

            {feedback !== '' && (
              <Text
                accessibilityRole={hasError ? 'alert' : 'text'}
                accessibilityLiveRegion="polite"
                style={[styles.feedback, hasError && styles.errorText]}
              >
                {feedback}
              </Text>
            )}

            <GoldButton
              label="Verify & Continue"
              onPress={submitCode}
              disabled={busy}
              style={{ marginTop: 18 }}
            />

            <Text style={styles.notice}>
              This code opens a local development preview only. Real contact
              verification connects during OTP provider setup.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>

        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={KEYBOARD_TOOLBAR_ID}>
            <View style={styles.keyboardToolbar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done, dismiss keyboard"
                onPress={() => Keyboard.dismiss()}
                style={styles.keyboardDoneButton}
              >
                <Text style={styles.linkText}>Done</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}

        <BrandedLoader
          visible={phase !== 'idle'}
          success={phase === 'success'}
          label={
            phase === 'success' ? 'Demo code accepted' : 'Checking demo code…'
          }
        />
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  topBar: {
    alignItems: 'flex-start',
    marginBottom: 8,
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
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceMuted,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: palette.goldText,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
    color: palette.inkNavy,
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    color: palette.textSecondary,
    marginBottom: 24,
  },
  input: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.borderInput,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceWarm,
    color: palette.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.error,
  },
  feedback: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  errorText: {
    color: colors.error,
  },
  notice: {
    marginTop: 24,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
    paddingHorizontal: 12,
  },
  keyboardDoneButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    color: palette.goldText,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.72,
  },
});
