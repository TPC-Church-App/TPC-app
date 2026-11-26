// ===============================================================
// File: apps/mobile/components/branded-loader.tsx
// Description: Reusable TPC branded loading screen with ivory backdrop and gold halo.
// Author: Josiah Ewumi
// ===============================================================

import { Check, AlertCircle } from 'lucide-react-native';
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

import BrandBackdrop from '@/components/ui/brand-backdrop';
import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

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
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    rotation.setValue(0);
    pulse.setValue(1);

    if (!visible || reducedMotion || success || complete || error) return;

    const spinAnim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      }),
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      ]),
    );

    spinAnim.start();
    pulseAnim.start();

    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, [visible, reducedMotion, success, complete, error, rotation, pulse]);

  if (!visible) return null;

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <BrandBackdrop style={inline ? { minHeight: 540 } : undefined}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.brand}>
            <Animated.View
              accessible={false}
              style={[styles.outerHalo, { transform: [{ scale: pulse }] }]}
            />
            <Animated.View
              accessible={false}
              style={[
                styles.ring,
                success && styles.successRing,
                error && styles.errorRing,
                { transform: [{ rotate }] },
              ]}
            />
            <View style={[styles.logoSurface, shadows.card]}>
              <Image
                source={require('../assets/light/church-logo-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="The Pentecostal Congregation logo"
              />
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.churchWordmark}>
            The Pentecostal{'\n'}Congregation
          </Text>

          <Text accessibilityLiveRegion="polite" style={styles.label}>
            {label}
          </Text>

          {children}

          {success && (
            <View
              accessibilityLabel="Success"
              style={[
                styles.statusBadge,
                { backgroundColor: palette.successSoft },
              ]}
            >
              <Check size={24} color={colors.success} strokeWidth={2.5} />
            </View>
          )}

          {error && (
            <View
              accessibilityLabel="Action needs attention"
              style={[
                styles.statusBadge,
                { backgroundColor: palette.errorSoft },
              ]}
            >
              <AlertCircle size={24} color={colors.error} strokeWidth={2.2} />
            </View>
          )}

          {onClose && (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>{closeLabel}</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </BrandBackdrop>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    width: 172,
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  ring: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3.5,
    borderColor: palette.borderSubtle,
    borderTopColor: palette.gold,
    borderRightColor: palette.goldDark,
  },
  logoSurface: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  successRing: {
    borderColor: colors.success,
    borderTopColor: colors.success,
    borderRightColor: colors.success,
  },
  errorRing: {
    borderColor: colors.error,
    borderTopColor: colors.error,
    borderRightColor: colors.error,
  },
  churchWordmark: {
    marginTop: 22,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    color: palette.inkNavy,
    letterSpacing: -0.2,
  },
  label: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: palette.textSecondary,
  },
  statusBadge: {
    marginTop: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 28,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.gold,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: palette.surface,
  },
  pressed: { opacity: 0.72 },
});
