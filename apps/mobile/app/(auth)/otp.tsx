// ===============================================================
// apps/mobile/app/(auth)/otp.tsx
// Preview verification-code entry and local format validation.
// No code is sent, verified with a server or stored persistently.
// ===============================================================

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

import { colors } from '@/constants/theme';

const CODE_LENGTH = 6;
const KEYBOARD_TOOLBAR_ID = 'verification-keyboard-toolbar';

// ===============================================================
// VERIFICATION PREVIEW
// Validate the input shape without treating it as authentication.
// ===============================================================

export default function VerificationScreen() {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hasError, setHasError] = useState(false);

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
    setFeedback('');
    setHasError(false);
  }

  function submitCode() {
    Keyboard.dismiss();

    if (code.length !== CODE_LENGTH) {
      setHasError(true);
      setFeedback(`Enter all ${CODE_LENGTH} digits.`);
      return;
    }

    setHasError(false);
    setFeedback(
      'The code format is complete. Server verification is not connected yet.',
    );
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
            Enter a {CODE_LENGTH}-digit sample code to test this screen. No
            verification code has been sent.
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
            Sending, resending and checking real codes will be connected with
            Supabase Auth. This preview does not sign you in.
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
    </SafeAreaView>
  );
}

// ===============================================================
// SCREEN STYLES
// Keep code entry readable and consistent with the church palette.
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
