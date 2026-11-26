// ===============================================================
// File: apps/mobile/components/ui/surface-card.tsx
// Description: Elevated white surface card with warm subtle border and shadow.
// Author: Josiah Ewumi
// ===============================================================

import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, radii, shadows } from '@/constants/theme';

export default function SurfaceCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, shadows.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
  },
});
