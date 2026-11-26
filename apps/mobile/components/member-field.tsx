// ===============================================================
// File: apps/mobile/components/member-field.tsx
// Description: Shared accessible labelled input in Warm Ivory & Gold style.
// Author: Josiah Ewumi
// ===============================================================

import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { fonts, palette, radii } from '@/constants/theme';

export default function MemberField({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength = 100,
  keyboardType = 'default',
  multiline = false,
  textContentType,
  autoComplete,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  textContentType?: TextInputProps['textContentType'];
  autoComplete?: TextInputProps['autoComplete'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        keyboardType={keyboardType}
        multiline={multiline}
        textContentType={textContentType}
        autoComplete={autoComplete}
        importantForAutofill={
          autoComplete && autoComplete !== 'off' ? 'yes' : 'auto'
        }
        placeholderTextColor={palette.textMuted}
        autoCapitalize={
          autoCapitalize ??
          (keyboardType === 'email-address' ? 'none' : 'sentences')
        }
        autoCorrect={keyboardType !== 'email-address'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textPrimary,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.borderInput,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceWarm,
    color: palette.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
});
