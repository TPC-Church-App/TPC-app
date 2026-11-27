// ===============================================================
// File: apps/mobile/components/member-back-button.tsx
// Description: Accessible circular Warm Ivory back button across member screens.
// Author: Josiah Ewumi
// ===============================================================

import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { palette, shadows } from '@/constants/theme';

export default function MemberBackButton({
  fallbackRoute = '/(tabs)/home',
  preferFallback = false,
}: {
  fallbackRoute?: Href;
  preferFallback?: boolean;
}) {
  function goBack() {
    if (!preferFallback && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={goBack}
      style={({ pressed }) => [
        styles.button,
        shadows.card,
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      <ChevronLeft size={20} color={palette.textPrimary} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    backgroundColor: palette.surface,
  },
  pressed: { opacity: 0.7 },
});
