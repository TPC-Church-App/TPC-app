// ===============================================================
// File: apps/mobile/components/ui/section-header.tsx
// Description: Section heading with optional gold View all action link.
// Author: Josiah Ewumi
// ===============================================================

import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, palette } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function SectionHeader({
  title,
  actionLabel = 'View all',
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {onActionPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          hitSlop={8}
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={16} color={palette.goldText} strokeWidth={2.2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: palette.textPrimary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: palette.goldText,
  },
  pressed: {
    opacity: 0.65,
  },
});
