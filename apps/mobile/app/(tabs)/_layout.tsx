// ===============================================================
// apps/mobile/app/(tabs)/_layout.tsx
// Share member navigation and guard every development preview tab.
// ===============================================================

import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/constants/theme';
import { useMemberDraft } from '@/store/member-draft';
import { useReducedMotion } from '@/utils/use-reduced-motion';

// ===============================================================
// MEMBER PREVIEW ACCESS AND TAB NAVIGATION
// ===============================================================

export default function MemberTabsLayout() {
  const { demoAccess } = useMemberDraft();
  const reducedMotion = useReducedMotion();

  if (!__DEV__ || !demoAccess) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? 'none' : 'fade',
        tabBarActiveTintColor: colors.link,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.decorativeBorder,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text accessible={false} style={{ color, fontSize: 28 }}>
              ⌂
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text accessible={false} style={{ color, fontSize: 28 }}>
              ○
            </Text>
          ),
        }}
      />
      {/* Keep these routes navigable: href: null redirects in this SDK. */}
      <Tabs.Screen
        name="more"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="giving"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      {[
        'settings',
        'messages',
        'sermons',
        'community',
        'checkout',
        'payment-return',
        'receipt',
      ].map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      ))}
    </Tabs>
  );
}
