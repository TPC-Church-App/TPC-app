// ===============================================================
// apps/mobile/app/(tabs)/_layout.tsx
// Configure visible member tabs and hidden feature routes.
// ===============================================================
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/constants/theme';

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
      <Tabs.Screen name="attendance" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="checkout" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="community" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="giving" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="history" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="messages" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="more" options={{ tabBarButton: () => null }} />
      <Tabs.Screen
        name="payment-return"
        options={{ tabBarButton: () => null }}
      />
      <Tabs.Screen name="receipt" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="scanner" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="sermons" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="settings" options={{ tabBarButton: () => null }} />
    </Tabs>
  );
}
