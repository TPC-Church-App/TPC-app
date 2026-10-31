// ===============================================================
// apps/mobile/app/(auth)/register.tsx
// Collect member details before phone/email verification.
// Church participation answers do not grant roles or block access.
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

import { profileError } from '@/utils/member-demo';
import { colors } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';

const TOOLBAR_ID = 'member-details-keyboard';

const ATTENDANCE_OPTIONS = [
  { value: 'regular', label: 'Regular attendee' },
  { value: 'visiting', label: 'Visiting' },
  { value: 'firstVisit', label: 'First visit' },
] as const;

// ===============================================================
// MEMBER DETAILS
// Update the shared draft while typing so back navigation retains it.
// ===============================================================

export default function RegisterScreen() {
  const { draft, updateDraft } = useMemberDraft();
  const [error, setError] = useState('');

  // ===============================================================
  // REQUIRED MEMBER DETAILS
  // Participation choices remain optional and do not grant access.
  // ===============================================================

  function continueToContact() {
    Keyboard.dismiss();

    const firstName = draft.firstName.trim();
    const surname = draft.surname.trim();
    const age = draft.age.trim();

    const validation = profileError(firstName, surname, age);
    if (validation) {
      setError(validation);
      return;
    }

    updateDraft({
      firstName,
      surname,
      age,
    });

    setError('');
    router.push('/(auth)/login');
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
            Tell us about yourself
          </Text>

          <Text style={styles.description}>
            Welcome to TPC. Enter your first name, surname and age. The church
            participation question below is optional.
          </Text>

          <Text style={styles.label}>First name</Text>
          <TextInput
            accessibilityLabel="First name"
            style={styles.input}
            value={draft.firstName}
            onChangeText={(firstName) => {
              updateDraft({ firstName });
              setError('');
            }}
            placeholder="Your first name"
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            accessibilityLabel="Surname"
            style={styles.input}
            value={draft.surname}
            onChangeText={(surname) => {
              updateDraft({ surname });
              setError('');
            }}
            placeholder="Your surname"
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="familyName"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            accessibilityLabel="Age"
            style={styles.input}
            value={draft.age}
            onChangeText={(age) => {
              updateDraft({ age });
              setError('');
            }}
            placeholder="Age in years — 4 or above"
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
            maxLength={3}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? TOOLBAR_ID : undefined
            }
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Your church connection
          </Text>

          <Text style={styles.help}>
            Choose an option if you wish. Everyone can continue.
          </Text>

          {ATTENDANCE_OPTIONS.map((option) => {
            const selected = draft.attendance === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  updateDraft({
                    attendance: selected ? '' : option.value,
                  })
                }
                style={[styles.option, selected && styles.selectedOption]}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                <Text style={styles.selectionMark}>
                  {selected ? 'Selected' : ''}
                </Text>
              </Pressable>
            );
          })}

          {error !== '' && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={continueToContact}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={TOOLBAR_ID}>
          <View style={styles.toolbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done, dismiss keyboard"
              onPress={() => Keyboard.dismiss()}
              style={styles.doneButton}
            >
              <Text style={styles.selectionMark}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
  );
}

// ===============================================================
// SCREEN STYLES
// Use the established church palette and accessible touch sizes.
// ===============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
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
    fontSize: 16,
    letterSpacing: 0,
    textAlign: 'left',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  help: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
    marginBottom: 16,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: colors.link,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  selectionMark: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.link,
  },
  error: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
    marginBottom: 12,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
  },
  doneButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
