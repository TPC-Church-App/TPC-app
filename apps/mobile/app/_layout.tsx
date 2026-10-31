// ===============================================================
// apps/mobile/app/_layout.tsx
// Provide the onboarding draft and configure frontend navigation.
// ===============================================================

import { DemoWorkspaceProvider } from '@/store/demo-workspace';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
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
          <StatusBar style="dark" />

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
            <Stack.Screen
              name="(auth)/register"
              options={{ title: 'About you' }}
            />
            <Stack.Screen
              name="(auth)/login"
              options={{ title: 'Your contact' }}
            />
            <Stack.Screen
              name="(auth)/otp"
              options={{ title: 'Verification' }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AttendanceDraftProvider>
      </DemoWorkspaceProvider>
    </MemberDraftProvider>
  );
}
