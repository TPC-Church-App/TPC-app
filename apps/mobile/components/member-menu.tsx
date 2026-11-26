// ===============================================================
// File: apps/mobile/components/member-menu.tsx
// Description: Shared member navigation drawer/modal in Warm Ivory & Gold UI.
// Author: Josiah Ewumi
// ===============================================================

import { router } from 'expo-router';
import { ChevronRight, Menu, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SurfaceCard from '@/components/ui/surface-card';
import { MEMBER_PAGES, MEMBER_ROUTES } from '@/constants/member-pages';
import { fonts, palette, radii, shadows } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

const MENU_ITEMS = [
  { key: 'home', title: 'Home / Dashboard' },
  { key: 'profile', title: 'Profile' },
  ...Object.entries(MEMBER_PAGES).map(([key, page]) => ({
    key,
    title: page.title,
  })),
];

export default function MemberMenu() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  function openPage(key: string) {
    setVisible(false);

    const destination = MEMBER_ROUTES[key as keyof typeof MEMBER_ROUTES];
    if (destination) router.navigate(destination);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open member menu"
        accessibilityState={{ expanded: visible }}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.trigger,
          shadows.card,
          pressed && styles.pressed,
        ]}
      >
        <Menu size={17} color={palette.goldText} strokeWidth={2.1} />
        <Text style={styles.link}>Menu</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss member menu"
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
            <SurfaceCard style={styles.panel}>
              <ScrollView
                contentContainerStyle={styles.panelContent}
                accessibilityViewIsModal
              >
                <View style={styles.heading}>
                  <Text accessibilityRole="header" style={styles.title}>
                    Explore TPC
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                    onPress={() => setVisible(false)}
                    style={styles.close}
                  >
                    <X size={20} color={palette.textSecondary} />
                  </Pressable>
                </View>

                {MENU_ITEMS.map((item, idx) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => openPage(item.key)}
                    style={({ pressed }) => [
                      styles.item,
                      idx > 0 && styles.itemDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.itemText}>{item.title}</Text>
                    <ChevronRight size={18} color={palette.goldText} />
                  </Pressable>
                ))}
              </ScrollView>
            </SurfaceCard>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    backgroundColor: palette.surface,
  },
  link: {
    fontFamily: fonts.semiBold,
    color: palette.goldText,
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
  overlay: { flex: 1, backgroundColor: 'rgba(19, 27, 46, 0.42)' },
  safeArea: { flex: 1, justifyContent: 'center' },
  panel: {
    margin: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 440,
    maxHeight: '82%',
    backgroundColor: palette.canvas,
    overflow: 'hidden',
  },
  panelContent: { padding: 20 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: palette.inkNavy,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    minHeight: 50,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSubtle,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: palette.textPrimary,
  },
});
