// ===============================================================
// File: apps/mobile/components/ui/brand-backdrop.tsx
// Description: Warm ivory canvas with soft concentric golden corner curves.
// Author: Josiah Ewumi
// ===============================================================

import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette } from '@/constants/theme';

export default function BrandBackdrop({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 390 844"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Top-left warm sand concentric arcs */}
          <Circle cx="18" cy="24" r="145" fill={palette.arcPrimary} />
          <Circle cx="18" cy="24" r="196" fill={palette.arcSecondary} />

          {/* Mid-right soft ambient curve */}
          <Circle cx="395" cy="295" r="158" fill={palette.arcSecondary} />
          <Circle
            cx="395"
            cy="295"
            r="210"
            fill="none"
            stroke={palette.arcStroke}
            strokeWidth="1.5"
          />

          {/* Bottom-right warm sand concentric arcs */}
          <Circle cx="378" cy="800" r="152" fill={palette.arcPrimary} />
          <Circle cx="378" cy="800" r="205" fill={palette.arcSecondary} />

          {/* Subtle bottom-left balance curve */}
          <Circle cx="-16" cy="680" r="110" fill={palette.arcSecondary} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
});
