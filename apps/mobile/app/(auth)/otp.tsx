// ===============================================================
// apps/mobile/app/(auth)/otp.tsx
// Check the development-only demo code and open the Home preview.
// This screen does not perform real contact authentication.
// ===============================================================

import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { colors } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';
import { useDemoTransition } from '@/utils/use-demo-transition';

const CODE_LENGTH = 6;
const KEYBOARD_TOOLBAR_ID = 'verification-keyboard-toolbar';

// ===============================================================
// VERIFICATION PREVIEW
// Enable local preview access only in development mode.
// ===============================================================

export default function VerificationScreen() {
  const { openDemo } = useMemberDraft();

  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hasError, setHasError] = useState(false);
  const { phase, busy, start } = useDemoTransition();

  // ===============================================================
  // CODE INPUT
  // Accept up to six digits and clear outdated feedback on edits.
  // ===============================================================

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
    setFeedback('');
    setHasError(false);
  }

  // ===============================================================
  // DEVELOPMENT CODE CHECK
  // Never use this local comparison as real authentication.
  // ===============================================================

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
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text accessibilityRole="header" style={styles.title}>
            Verify your contact
          </Text>

          <Text style={styles.description}>
            {__DEV__
              ? 'Development preview: enter 123456 to open Home. No verification code has been sent.'
              : 'Contact verification is not connected in this build.'}
          </Text>

          <Text style={styles.label}>Verification code</Text>

          <TextInput
            accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
            value={code}
            onChangeText={updateCode}
            style={[styles.input, hasError && styles.inputError]}
            placeholder="000000"
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
            autoCorrect={false}
            autoCapitalize="none"
            inputAccessoryViewID={
              Platform.OS === 'ios' ? KEYBOARD_TOOLBAR_ID : undefined
            }
            returnKeyType="done"
            onSubmitEditing={submitCode}
          />

          <Pressable
            accessibilityRole="button"
            onPress={submitCode}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Enter</Text>
          </Pressable>

          {feedback !== '' && (
            <Text
              accessibilityRole={hasError ? 'alert' : 'text'}
              accessibilityLiveRegion="polite"
              style={[styles.feedback, hasError && styles.errorText]}
            >
              {feedback}
            </Text>
          )}

          <Text style={styles.notice}>
            This code opens a local development preview only. Real contact
            verification will be connected during backend integration.
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
  );
}

// ===============================================================
// SCREEN STYLES
// Preserve the church palette and existing keyboard controls.
// ===============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.secondaryText,
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.error,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
  },
  errorText: {
    color: colors.error,
  },
  notice: {
    marginTop: 32,
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.link,
    fontSize: 16,
    fontWeight: '600',
  },
});
