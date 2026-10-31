// ===============================================================
// apps/mobile/components/member-menu.tsx
// Shared member menu. Home remains the member dashboard.
// ===============================================================

import { router } from 'expo-router';
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

import { MEMBER_PAGES, MEMBER_ROUTES } from '@/constants/member-pages';
import { colors } from '@/constants/theme';
import { useReducedMotion } from '@/utils/use-reduced-motion';

// ===============================================================
// MEMBER MENU DESTINATIONS
// ===============================================================

const MENU_ITEMS = [
  { key: 'home', title: 'Home / Dashboard' },
  { key: 'profile', title: 'Profile' },
  ...Object.entries(MEMBER_PAGES).map(([key, page]) => ({
    key,
    title: page.title,
  })),
];

// ===============================================================
// MENU STATE AND NAVIGATION
// ===============================================================

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
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text style={styles.link}>Menu ☰</Text>
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
            <ScrollView
              style={styles.panel}
              contentContainerStyle={styles.panelContent}
              accessibilityViewIsModal
            >
              <View style={styles.heading}>
                <Text accessibilityRole="header" style={styles.title}>
                  Explore TPC
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setVisible(false)}
                  style={styles.close}
                >
                  <Text style={styles.link}>Close</Text>
                </Pressable>
              </View>

              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => openPage(item.key)}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.itemText}>{item.title}</Text>
                  <Text accessible={false} style={styles.link}>
                    ›
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// ===============================================================
// MEMBER MENU STYLES
// ===============================================================

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.decorativeBorder,
    backgroundColor: colors.surface,
  },
  link: {
    color: colors.link,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  pressed: { opacity: 0.65 },
  overlay: { flex: 1, backgroundColor: 'rgba(48,45,41,0.35)' },
  safeArea: { flex: 1 },
  panel: {
    flexGrow: 0,
    margin: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 480,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  panelContent: { padding: 20 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  item: {
    minHeight: 52,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.decorativeBorder,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
