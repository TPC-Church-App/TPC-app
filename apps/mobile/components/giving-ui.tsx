// ===============================================================
// apps/mobile/components/giving-ui.tsx
// Shared presentation for Giving and its separate history page.
// ===============================================================

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

import MemberMenu from '@/components/member-menu';
import { colors } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

// ===============================================================
// SHARED TPC WORDMARK
// ===============================================================

function GivingBrand({ caption }: { caption: string }) {
  return (
    <View style={givingStyles.brand}>
      <Image
        source={require('../assets/light/church-logo.png')}
        style={givingStyles.logo}
        resizeMode="contain"
        accessibilityLabel="The Pentecostal Congregation logo"
      />
      <View style={givingStyles.wordmark}>
        <Text style={givingStyles.churchName}>TPC</Text>
        <Text style={givingStyles.eyebrow}>{caption}</Text>
      </View>
    </View>
  );
}

// ===============================================================
// BRANDED MEMBER PAGE SHELL
// ===============================================================

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
    <SafeAreaView style={givingStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={givingStyles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={givingStyles.row}>
          <GivingBrand caption={sectionLabel} />
          <MemberMenu />
        </View>
        <Text accessibilityRole="header" style={givingStyles.title}>
          {title}
        </Text>
        <Text style={givingStyles.subtitle}>{subtitle}</Text>
        <View style={givingStyles.stack}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===============================================================
// ACCESSIBLE ACTION BUTTON
// ===============================================================

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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        givingStyles.button,
        secondary && givingStyles.secondaryButton,
        disabled && givingStyles.disabled,
        pressed && givingStyles.pressed,
      ]}
    >
      <Text style={secondary ? givingStyles.link : givingStyles.buttonText}>
        {label}
      </Text>
    </Pressable>
  );
}

// ===============================================================
// SELECTABLE OPTION CONTROL
// ===============================================================

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
      <Text style={givingStyles.link}>{label}</Text>
    </Pressable>
  );
}

// ===============================================================
// SCROLLABLE MODAL WITH REDUCED MOTION
// ===============================================================

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
      <SafeAreaView style={givingStyles.screen}>
        <ScrollView contentContainerStyle={givingStyles.content}>
          <View style={givingStyles.row}>
            <GivingBrand caption="UI PREVIEW" />
            <GivingButton label="Close" secondary onPress={onClose} />
          </View>
          <Text accessibilityRole="header" style={givingStyles.title}>
            {title}
          </Text>
          <View style={givingStyles.stack}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ===============================================================
// SHARED MEMBER INTERFACE STYLES
// ===============================================================

export const givingStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 10,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    backgroundColor: colors.surface,
  },
  wordmark: { flexShrink: 1 },
  churchName: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  stack: { gap: 20 },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 12,
  },
  hero: { backgroundColor: colors.primary, borderColor: colors.primary },
  title: {
    fontSize: 30,
    lineHeight: 39,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.secondaryText,
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
  },
  body: { fontSize: 15, lineHeight: 23, color: colors.secondaryText },
  heroBody: { fontSize: 15, lineHeight: 23, color: colors.onPrimary },
  caption: { fontSize: 13, lineHeight: 20, color: colors.secondaryText },
  eyebrow: {
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 1,
    fontWeight: '700',
    color: colors.link,
  },
  label: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.text,
  },
  amount: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    minHeight: 52,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    letterSpacing: 0,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  link: { fontSize: 15, lineHeight: 23, fontWeight: '600', color: colors.link },
  choice: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.link, backgroundColor: colors.background },
  error: { fontSize: 14, lineHeight: 21, color: colors.error },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
});
