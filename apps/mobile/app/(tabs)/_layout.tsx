// ===============================================================
// File: apps/mobile/app/(tabs)/_layout.tsx
// Description: Configure 4-tab member navigation matching the Warm Ivory & Gold UI.
// Author: Josiah Ewumi
// ===============================================================

import { Tabs } from 'expo-router';
import { Heart, Home, ScanLine, User } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, palette, shadows } from '@/constants/theme';

type MemberTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const hiddenRouteOptions = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' as const },
};

const VISIBLE_TABS = [
  { name: 'home', label: 'Home' },
  { name: 'attendance', label: 'Check-in' },
  { name: 'giving', label: 'Give' },
  { name: 'profile', label: 'Profile' },
] as const;

function renderTabIcon(name: string, active: boolean) {
  const color = active ? palette.goldIcon : palette.textSecondary;
  const strokeWidth = active ? 2.2 : 1.75;

  if (name === 'home') {
    return (
      <Home
        size={22}
        color={color}
        strokeWidth={strokeWidth}
        fill={active ? palette.gold : 'transparent'}
      />
    );
  }
  if (name === 'attendance') {
    return <ScanLine size={22} color={color} strokeWidth={strokeWidth} />;
  }
  if (name === 'giving') {
    return (
      <Heart
        size={22}
        color={color}
        strokeWidth={strokeWidth}
        fill={active ? palette.gold : 'transparent'}
      />
    );
  }
  return <User size={22} color={color} strokeWidth={strokeWidth} />;
}

function MemberTabBar({ state, emitter, navigateToTab }: MemberTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={[styles.bar, shadows.tabBar]}>
        {VISIBLE_TABS.map((tab) => {
          const routeIndex = state.routes.findIndex(
            (r: { name: string }) => r.name === tab.name,
          );
          const route = routeIndex >= 0 ? state.routes[routeIndex] : null;
          const isFocused =
            activeRouteName === tab.name ||
            (tab.name === 'attendance' && activeRouteName === 'scanner') ||
            (tab.name === 'giving' &&
              ['checkout', 'payment-return', 'receipt', 'history'].includes(
                activeRouteName ?? '',
              ));

          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                if (!route) return;
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              }}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.pressed,
              ]}
            >
              {renderTabIcon(tab.name, isFocused)}
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[styles.indicator, isFocused && styles.indicatorActive]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MemberTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MemberTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Check-in' }} />
      <Tabs.Screen name="giving" options={{ title: 'Give' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

      {/* Hidden auxiliary routes opened via navigation actions */}
      <Tabs.Screen name="checkout" options={hiddenRouteOptions} />
      <Tabs.Screen name="community" options={hiddenRouteOptions} />
      <Tabs.Screen name="history" options={hiddenRouteOptions} />
      <Tabs.Screen name="messages" options={hiddenRouteOptions} />
      <Tabs.Screen name="more" options={hiddenRouteOptions} />
      <Tabs.Screen name="payment-return" options={hiddenRouteOptions} />
      <Tabs.Screen name="receipt" options={hiddenRouteOptions} />
      <Tabs.Screen name="scanner" options={hiddenRouteOptions} />
      <Tabs.Screen name="sermons" options={hiddenRouteOptions} />
      <Tabs.Screen name="settings" options={hiddenRouteOptions} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: palette.borderSubtle,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: palette.goldText,
  },
  tabLabelInactive: {
    fontFamily: fonts.medium,
    color: palette.textSecondary,
  },
  indicator: {
    marginTop: 2,
    height: 2.5,
    width: 36,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: palette.gold,
  },
  pressed: {
    opacity: 0.7,
  },
});
