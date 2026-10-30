// ===============================================================
// apps/mobile/app/(auth)/login.tsx
// Collect phone/email input with country selection and formatting.
// Enter validates locally; OTP requests are not connected yet.
// ===============================================================

import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { router } from 'expo-router';
import type { CountryCode } from 'libphonenumber-js';
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

import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  getPhoneCountryLabel,
} from '@/constants/countries';
import { colors } from '@/constants/theme';
import { formatPhoneInput, validatePhoneInput } from '@/utils/phone';

// ===============================================================
// LOCAL TYPES AND KEYBOARD IDENTIFIER
// ===============================================================

type ContactFeedback = {
  message: string;
  valid: boolean;
};

const CONTACT_KEYBOARD_TOOLBAR_ID = 'contact-keyboard-toolbar';

// ===============================================================
// SIGN-IN SCREEN
// Keep contact details in local state until Auth is connected.
// ===============================================================

export default function LoginScreen() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [country, setCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<ContactFeedback | null>(null);

  const isPhone = method === 'phone';
  const selectedCountry = PHONE_COUNTRIES.find(
    (item) => item.code === country,
  )!;

  // ===============================================================
  // INPUT AND COUNTRY CHANGES
  // Avoid reinterpreting an existing local number as another country.
  // ===============================================================

  function updateContact(value: string) {
    setFeedback(null);

    if (!isPhone) {
      setContact(value);
      return;
    }

    const formatted = formatPhoneInput(value, country);

    // Allow deletion of a formatting separator without immediately
    // inserting that same separator again.
    const deletingSeparator =
      value.length < contact.length && formatted === contact;

    setContact(deletingSeparator ? value : formatted);
  }

  function switchMethod() {
    Keyboard.dismiss();
    setMethod((current) => (current === 'phone' ? 'email' : 'phone'));
    setContact('');
    setFeedback(null);
    setCountryPickerOpen(false);
  }

  function changeCountry(nextCountry: CountryCode) {
    if (nextCountry === country) return;

    setCountry(nextCountry);
    setContact('');
    setFeedback(null);
  }

  function toggleCountryPicker() {
    Keyboard.dismiss();
    setCountryPickerOpen((open) => !open);
  }

  // ===============================================================
  // CONTACT VALIDATION
  // A valid numbering pattern does not prove contact ownership.
  // ===============================================================

  function validateContact() {
    Keyboard.dismiss();
    setCountryPickerOpen(false);

    if (isPhone) {
      const result = validatePhoneInput(contact, country);

      if (!result.valid) {
        setFeedback({ valid: false, message: result.message });
        return;
      }

      const supportedCountry = PHONE_COUNTRIES.find(
        (item) => item.code === result.country,
      );

      if (!supportedCountry) {
        setFeedback({
          valid: false,
          message: 'Use a phone number from one of the listed countries.',
        });
        return;
      }

      // An explicit international prefix takes precedence over the
      // previously selected default country.
      setCountry(supportedCountry.code);
      setContact(result.displayNumber);
    } else {
      const trimmed = contact.trim();

      if (!trimmed) {
        setFeedback({
          valid: false,
          message: 'Enter your email address.',
        });
        return;
      }

      if (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setFeedback({
          valid: false,
          message: 'Enter an email address such as you@example.com.',
        });
        return;
      }

      setContact(trimmed);
    }

    setFeedback(null);
    // Frontend preview only. Real navigation will follow a successful
    // OTP request when Supabase Auth is connected.
    router.push('/(auth)/otp');
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
            Welcome back
          </Text>

          <Text style={styles.description}>
            {isPhone
              ? 'Use your phone number to sign in.'
              : 'Use your email address to sign in.'}
          </Text>

          {isPhone && (
            <>
              <Text style={styles.label}>Country</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Country: ${getPhoneCountryLabel(selectedCountry)}`}
                accessibilityState={{ expanded: countryPickerOpen }}
                onPress={toggleCountryPicker}
                style={({ pressed }) => [
                  styles.countryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.countryText}>
                  {getPhoneCountryLabel(selectedCountry)}
                </Text>
                <Text style={styles.countryAction}>
                  {countryPickerOpen ? 'Close' : 'Change'}
                </Text>
              </Pressable>

              {countryPickerOpen && (
                <View style={styles.pickerPanel}>
                  <Picker<CountryCode>
                    selectedValue={country}
                    onValueChange={changeCountry}
                    accessibilityLabel="Select your phone country"
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {PHONE_COUNTRIES.map((item) => (
                      <Picker.Item
                        key={item.code}
                        label={getPhoneCountryLabel(item)}
                        value={item.code}
                        color={colors.text}
                      />
                    ))}
                  </Picker>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCountryPickerOpen(false)}
                    style={styles.pickerDoneButton}
                  >
                    <Text style={styles.linkText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <Text style={styles.label}>
            {isPhone ? 'Phone number' : 'Email address'}
          </Text>

          <TextInput
            key={method}
            accessibilityLabel={isPhone ? 'Phone number' : 'Email address'}
            style={[
              styles.input,
              feedback?.valid === false && styles.inputError,
            ]}
            value={contact}
            onChangeText={updateContact}
            onFocus={() => setCountryPickerOpen(false)}
            placeholder={
              isPhone
                ? country === 'NG'
                  ? '0701 234 5678'
                  : 'Phone number'
                : 'you@example.com'
            }
            placeholderTextColor={colors.secondaryText}
            keyboardType={isPhone ? 'phone-pad' : 'email-address'}
            textContentType={isPhone ? 'telephoneNumber' : 'emailAddress'}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={isPhone ? 40 : 254}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? CONTACT_KEYBOARD_TOOLBAR_ID : undefined
            }
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          {isPhone && (
            <Text style={styles.help}>
              {country === 'NG'
                ? 'Use your local number, such as 0701 234 5678, or include +234.'
                : 'Use your local number for the selected country, or include the international + code.'}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={switchMethod}
            style={({ pressed }) => [
              styles.switchButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.linkText}>
              {isPhone ? 'Use email instead' : 'Use phone instead'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={validateContact}
            style={({ pressed }) => [
              styles.enterButton,
              pressed && styles.enterButtonPressed,
            ]}
          >
            <Text style={styles.enterButtonText}>Enter</Text>
          </Pressable>

          {feedback && (
            <Text
              accessibilityRole={feedback.valid ? 'text' : 'alert'}
              accessibilityLiveRegion="polite"
              style={[styles.feedback, !feedback.valid && styles.errorText]}
            >
              {feedback.message}
            </Text>
          )}

          <Text style={styles.notice}>
            Interface preview: verification codes are not being sent yet. Use
            sample details while testing.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={CONTACT_KEYBOARD_TOOLBAR_ID}>
          <View style={styles.keyboardToolbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done, dismiss keyboard"
              onPress={() => Keyboard.dismiss()}
              style={({ pressed }) => [
                styles.keyboardDoneButton,
                pressed && styles.pressed,
              ]}
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
// Keep controls readable and preserve the cream/gold palette.
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
  countryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  countryText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginRight: 12,
  },
  countryAction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.link,
  },
  pickerPanel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: colors.text,
  },
  pickerItem: {
    fontSize: 18,
    color: colors.text,
  },
  pickerDoneButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.decorativeBorder,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  help: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
  },
  switchButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginTop: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.link,
  },
  enterButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  enterButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  enterButtonText: {
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
  notice: {
    marginTop: 32,
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
  },
});
