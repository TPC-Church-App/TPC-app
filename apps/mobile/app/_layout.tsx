// ===============================================================
// apps/mobile/app/_layout.tsx
// Configure navigation between the welcome and sign-in screens.
// ===============================================================

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';

// ===============================================================
// ROOT NAVIGATION
// Give sign-in a native header and back navigation.
// ===============================================================

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Sign in',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="(auth)/otp"
          options={{
            title: 'Verification',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
      </Stack>
    </>
  );
}
