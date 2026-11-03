// ===============================================================
// apps/mobile/app/(tabs)/_layout.tsx
// Configure visible member tabs and hidden feature routes.
// ===============================================================
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/constants/theme';

// Hide auxiliary tab items from layout while keeping their routes navigable.
const hiddenRouteOptions = {
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' as const },
};

// ===============================================================
// MEMBER TAB NAVIGATION
// ===============================================================

export default function MemberTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.link,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.decorativeBorder,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      {/* ===============================================================
          VISIBLE MEMBER TABS
          =============================================================== */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>○</Text>
          ),
        }}
      />

      {/* ===============================================================
          HIDDEN FEATURE ROUTES
          These screens open from member navigation instead of the tab bar.
          =============================================================== */}
      <Tabs.Screen name="attendance" options={hiddenRouteOptions} />
      <Tabs.Screen name="checkout" options={hiddenRouteOptions} />
      <Tabs.Screen name="community" options={hiddenRouteOptions} />
      <Tabs.Screen name="giving" options={hiddenRouteOptions} />
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
