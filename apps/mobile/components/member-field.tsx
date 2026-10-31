// ===============================================================
// apps/mobile/components/member-field.tsx
// Share accessible labelled text inputs.
// ===============================================================

import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { givingStyles as ui } from '@/components/giving-ui';
import { colors } from '@/constants/theme';

// ===============================================================
// LABELLED MEMBER FORM INPUT
// ===============================================================

export default function MemberField({
  label,
  value,
  onChangeText,
  maxLength = 100,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={ui.input}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.secondaryText}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={keyboardType !== 'email-address'}
      />
    </View>
  );
}
