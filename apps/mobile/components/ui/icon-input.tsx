// ===============================================================
// File: apps/mobile/components/ui/icon-input.tsx
// Description: Rounded warm-ivory text field with leading icon and eye toggle.
// Author: Josiah Ewumi
// ===============================================================

import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, palette, radii } from '@/constants/theme';

type IconInputProps = TextInputProps & {
  icon: ReactNode;
  error?: boolean;
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
};

export default function IconInput({
  icon,
  error = false,
  secureToggle = false,
  secureTextEntry,
  containerStyle,
  style,
  autoComplete,
  importantForAutofill,
  onFocus,
  onBlur,
  ...rest
}: IconInputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isSecure = secureToggle ? !revealed : Boolean(secureTextEntry);
  const resolvedAutofill =
    importantForAutofill ??
    (autoComplete && autoComplete !== 'off' ? 'yes' : 'auto');

  return (
    <View
      style={[
        styles.wrapper,
        focused && styles.focused,
        error && styles.error,
        containerStyle,
      ]}
    >
      <View style={styles.leading}>{icon}</View>
      <TextInput
        {...rest}
        autoComplete={autoComplete}
        importantForAutofill={resolvedAutofill}
        secureTextEntry={isSecure}
        placeholderTextColor={palette.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, style]}
      />
      {secureToggle && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          hitSlop={8}
          onPress={() => setRevealed((prev) => !prev)}
          style={styles.trailing}
        >
          {revealed ? (
            <Eye size={20} color={palette.textSecondary} strokeWidth={1.75} />
          ) : (
            <EyeOff
              size={20}
              color={palette.textSecondary}
              strokeWidth={1.75}
            />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: palette.borderInput,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    gap: 12,
  },
  focused: {
    borderColor: palette.gold,
    backgroundColor: palette.surface,
  },
  error: {
    borderColor: colors.error,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.textPrimary,
    paddingVertical: 10,
  },
  trailing: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
