// ===============================================================
// File: apps/mobile/app/(tabs)/more.tsx
// Description: Explore TPC hub for quick actions + legacy section redirect.
// Author: Josiah Ewumi
// ===============================================================

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Heart,
  QrCode,
  Receipt,
  Settings,
  User,
  Users,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GivingPage } from '@/components/giving-ui';
import SurfaceCard from '@/components/ui/surface-card';
import { MEMBER_ROUTES } from '@/constants/member-pages';
import { fonts, palette } from '@/constants/theme';

const EXPLORE_ITEMS = [
  {
    key: 'giving',
    title: 'Give',
    subtitle: 'Tithes, offerings & church projects',
    route: '/(tabs)/giving' as const,
    Icon: Heart,
  },
  {
    key: 'history',
    title: 'My Giving History',
    subtitle: 'Receipts & verified offerings',
    route: '/(tabs)/history' as const,
    Icon: Receipt,
  },
  {
    key: 'attendance',
    title: 'My Attendance',
    subtitle: 'Service schedule, check-in & history',
    route: '/(tabs)/attendance' as const,
    Icon: CalendarCheck,
  },
  {
    key: 'scanner',
    title: 'Scan Service QR',
    subtitle: 'Check in at the auditorium',
    route: '/(tabs)/scanner' as const,
    Icon: QrCode,
  },
  {
    key: 'messages',
    title: 'Messages & Announcements',
    subtitle: 'Weekly word & church updates',
    route: '/(tabs)/messages' as const,
    Icon: Bell,
  },
  {
    key: 'sermons',
    title: 'Sermons',
    subtitle: 'Teaching library & audio player',
    route: '/(tabs)/sermons' as const,
    Icon: BookOpen,
  },
  {
    key: 'community',
    title: 'Church Community',
    subtitle: 'Departments, badges & invitations',
    route: '/(tabs)/community' as const,
    Icon: Users,
  },
  {
    key: 'profile',
    title: 'My Profile',
    subtitle: 'Personal details, photo & departments',
    route: '/(tabs)/profile' as const,
    Icon: User,
  },
  {
    key: 'settings',
    title: 'Settings',
    subtitle: 'Notification preferences & device options',
    route: '/(tabs)/settings' as const,
    Icon: Settings,
  },
] as const;

export default function MoreScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  if (section) {
    const destination = MEMBER_ROUTES[section as keyof typeof MEMBER_ROUTES];
    if (destination) return <Redirect href={destination} />;
  }

  return (
    <GivingPage
      title="Explore TPC"
      subtitle="Everything across your church community in one place."
      sectionLabel="QUICK ACTIONS"
    >
      <SurfaceCard style={styles.listCard}>
        {EXPLORE_ITEMS.map((item, idx) => {
          const IconComponent = item.Icon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => router.navigate(item.route)}
              style={({ pressed }) => [
                styles.row,
                idx > 0 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconCircle}>
                <IconComponent
                  size={19}
                  color={palette.goldIcon}
                  strokeWidth={1.9}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={palette.textMuted} />
            </Pressable>
          );
        })}
      </SurfaceCard>
    </GivingPage>
  );
}

const styles = StyleSheet.create({
  listCard: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#F3ECE0',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: palette.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
