// ===============================================================
// File: apps/mobile/components/giving-ui.tsx
// Description: Shared Warm Ivory & Gold shells, buttons, chips, and sheets.
// Author: Josiah Ewumi
// ===============================================================

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MemberBackButton from '@/components/member-back-button';
import MemberMenu from '@/components/member-menu';
import BrandBackdrop from '@/components/ui/brand-backdrop';
import { colors, fonts, palette, radii, shadows } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

function GivingBrand({ caption }: { caption: string }) {
  return (
    <View style={givingStyles.brand}>
      <View style={[givingStyles.logoWrap, shadows.card]}>
        <Image
          source={require('../assets/light/church-logo-transparent.png')}
          style={givingStyles.logo}
          resizeMode="contain"
          accessibilityLabel="The Pentecostal Congregation logo"
        />
      </View>
      <View style={givingStyles.wordmark}>
        <Text style={givingStyles.churchName}>TPC</Text>
        <Text style={givingStyles.eyebrow}>{caption}</Text>
      </View>
    </View>
  );
}

export function GivingPage({
  title,
  subtitle,
  sectionLabel = 'GIVING',
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  sectionLabel?: string;
}>) {
  return (
    <BrandBackdrop>
      <SafeAreaView
        style={givingStyles.screen}
        edges={['top', 'left', 'right']}
      >
        <ScrollView
          contentContainerStyle={givingStyles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <View style={givingStyles.row}>
            <MemberBackButton />
            <View style={givingStyles.brandSlot}>
              <GivingBrand caption={sectionLabel} />
            </View>
            <MemberMenu />
          </View>
          <Text accessibilityRole="header" style={givingStyles.title}>
            {title}
          </Text>
          <Text style={givingStyles.subtitle}>{subtitle}</Text>

          {/* FIXED: Using React.Children.toArray to prevent crash on whitespace text nodes */}
          <View style={givingStyles.stack}>
            {React.Children.toArray(children)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BrandBackdrop>
  );
}

export function GivingButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  if (secondary) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          givingStyles.button,
          givingStyles.secondaryButton,
          shadows.card,
          disabled && givingStyles.disabled,
          pressed && givingStyles.pressed,
        ]}
      >
        <Text style={givingStyles.link}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        givingStyles.primaryWrap,
        shadows.card,
        disabled && givingStyles.disabled,
        pressed && givingStyles.pressed,
      ]}
    >
      <LinearGradient
        colors={palette.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={givingStyles.button}
      >
        <Text style={givingStyles.buttonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GivingChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        givingStyles.choice,
        selected && givingStyles.selected,
        pressed && givingStyles.pressed,
      ]}
    >
      <Text
        style={[givingStyles.link, selected && { color: palette.textPrimary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function GivingSheet({
  title,
  visible,
  onClose,
  children,
}: PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
}>) {
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <BrandBackdrop>
        <SafeAreaView style={givingStyles.screen}>
          <ScrollView contentContainerStyle={givingStyles.content}>
            <View style={givingStyles.row}>
              <GivingBrand caption="TPC" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [
                  givingStyles.closeCircle,
                  shadows.card,
                  pressed && givingStyles.pressed,
                ]}
              >
                <X size={20} color={palette.textPrimary} />
              </Pressable>
            </View>
            <Text accessibilityRole="header" style={givingStyles.title}>
              {title}
            </Text>
            <View style={givingStyles.stack}>
              {React.Children.toArray(children)}
            </View>
          </ScrollView>
        </SafeAreaView>
      </BrandBackdrop>
    </Modal>
  );
}

export const givingStyles = StyleSheet.create({
  screen: { flex: 1 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 10,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    backgroundColor: palette.surface,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  wordmark: { flexShrink: 1 },
  churchName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 22,
    color: palette.inkNavy,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  brandSlot: {
    flex: 1,
    minWidth: 150,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  stack: { gap: 16 },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    gap: 12,
    ...(shadows.card ?? {}),
  },
  hero: {
    backgroundColor: palette.gold,
    borderColor: palette.goldDark,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 27,
    lineHeight: 34,
    color: palette.inkNavy,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
    marginBottom: 20,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: palette.textPrimary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: palette.textSecondary,
  },
  heroBody: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: palette.surface,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    lineHeight: 15,
    letterSpacing: 1.1,
    color: palette.goldText,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: palette.textPrimary,
  },
  amount: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 34,
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
    letterSpacing: 0,
  },
  primaryWrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  secondaryButton: {
    backgroundColor: palette.surfaceWarm,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 21,
    color: palette.surface,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: palette.goldText,
  },
  choice: {
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    borderRadius: radii.pill,
    justifyContent: 'center',
    backgroundColor: palette.surfaceWarm,
  },
  selected: {
    borderColor: palette.gold,
    backgroundColor: palette.surfaceMuted,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
