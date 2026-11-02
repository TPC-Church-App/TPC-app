// ===============================================================
// apps/mobile/app/_layout.tsx
// Provide the onboarding draft and configure frontend navigation.
// ===============================================================

import {
  DemoWorkspaceProvider,
  useDemoWorkspace,
} from '@/store/demo-workspace';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { darkColors, lightColors, ThemeContext } from '@/constants/theme';
import { MemberDraftProvider } from '@/store/member-draft';
import { AttendanceDraftProvider } from '@/store/attendance-draft';

// ===============================================================
// ROOT NAVIGATION
// Preserve arrow-only back navigation through onboarding.
// ===============================================================

export default function RootLayout() {
  return (
    <MemberDraftProvider>
      <DemoWorkspaceProvider>
        <AttendanceDraftProvider>
          <ThemedNavigation />
        </AttendanceDraftProvider>
      </DemoWorkspaceProvider>
    </MemberDraftProvider>
  );
}

// ===============================================================
// THEME-AWARE NAVIGATION
// Keep system bars and router surfaces aligned with the saved preference.
// ===============================================================

function ThemedNavigation() {
  const { data } = useDemoWorkspace();
  const systemScheme = useColorScheme() ?? 'light';
  const scheme = data.appearance === 'system' ? systemScheme : data.appearance;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    // Native controls follow the chosen appearance; app surfaces use the same palette.
    Appearance.setColorScheme(
      data.appearance === 'system' ? 'auto' : data.appearance,
    );
  }, [data.appearance]);

  return (
    <ThemeContext.Provider
      value={{ colors, preference: data.appearance, scheme }}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.link,
          headerTitleStyle: { color: colors.text },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ title: 'About you' }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Your contact' }} />
        <Stack.Screen name="(auth)/otp" options={{ title: 'Verification' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeContext.Provider>
  );
}
