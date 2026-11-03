// ===============================================================
// apps/mobile/components/member-back-button.tsx
// Provide a consistent accessible back action for member screens.
// ===============================================================

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

// ===============================================================
// MEMBER SCREEN BACK ACTION
// Use navigation history when available and a safe route fallback otherwise.
// ===============================================================

export default function MemberBackButton({
  fallbackRoute = '/(tabs)/home',
}: {
  fallbackRoute?: Href;
}) {
  function goBack() {
    if (router.canGoBack()) {
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
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={4}
    >
      <Text accessible={false} style={styles.arrow}>
        ‹
      </Text>
    </Pressable>
  );
}

// ===============================================================
// BACK BUTTON STYLES
// ===============================================================

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    backgroundColor: colors.surface,
  },
  arrow: {
    marginTop: -3,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '500',
    color: colors.text,
  },
  pressed: { opacity: 0.65 },
});
