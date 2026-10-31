// ===============================================================
// apps/mobile/components/branded-loader.tsx
// Reusable TPC loading screen.
// Its parent controls visibility; no artificial waiting is added.
// ===============================================================

import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

// ===============================================================
// LOADER INPUTS
// ===============================================================

type BrandedLoaderProps = {
  visible: boolean;
  inline?: boolean;
  label?: string;
  success?: boolean;
  complete?: boolean;
  error?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  children?: ReactNode;
};

// ===============================================================
// LOADER ANIMATION AND RESULT STATES
// ===============================================================

export default function BrandedLoader({
  visible,
  inline = false,
  label = 'Loading…',
  success = false,
  complete = false,
  error = false,
  onClose,
  closeLabel = 'Close preview',
  children,
}: BrandedLoaderProps) {
  const reducedMotion = useReducedMotion();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotation.setValue(0);

    if (!visible || reducedMotion || success || complete || error) return;

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, reducedMotion, success, complete, error, rotation]);

  if (!visible) return null;

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <SafeAreaView style={[styles.screen, inline && { minHeight: 540 }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Animated.View
            accessible={false}
            style={[
              styles.ring,
              success && styles.successRing,
              error && {
                borderColor: colors.error,
                borderTopColor: colors.error,
                borderRightColor: colors.error,
              },
              { transform: [{ rotate }] },
            ]}
          />
          <Image
            source={require('../assets/light/church-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="The Pentecostal Congregation logo"
          />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          TPC
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.label}>
          {label}
        </Text>

        {children}

        {success && (
          <Text accessibilityLabel="Success" style={styles.successTick}>
            ✓
          </Text>
        )}

        {error && (
          <Text
            accessibilityLabel="Action needs attention"
            style={[styles.successTick, { color: colors.error }]}
          >
            !
          </Text>
        )}

        {onClose && (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{closeLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
  return inline ? (
    content
  ) : (
    <Modal
      visible={visible}
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={() => onClose?.()}
    >
      {content}
    </Modal>
  );
}

// ===============================================================
// LOADER STYLES
// ===============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 4,
    borderColor: colors.decorativeBorder,
    borderTopColor: colors.primary,
    borderRightColor: colors.primaryPressed,
  },
  logo: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: colors.surface,
  },
  successRing: {
    borderColor: colors.success,
    borderTopColor: colors.success,
    borderRightColor: colors.success,
  },
  successTick: {
    marginTop: 16,
    fontSize: 44,
    lineHeight: 56,
    fontWeight: '700',
    color: colors.success,
  },
  title: {
    marginTop: 24,
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.secondaryText,
  },
  button: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  pressed: { opacity: 0.65 },
});
