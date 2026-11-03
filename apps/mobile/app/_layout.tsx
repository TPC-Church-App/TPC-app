// ===============================================================
// apps/mobile/app/_layout.tsx
// Provide shared app state and configure the root navigation stack.
// ===============================================================

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/theme';
import { MemberDraftProvider } from '@/store/member-draft';
import { DemoWorkspaceProvider } from '@/store/demo-workspace';
import { AttendanceDraftProvider } from '@/store/attendance-draft';

// ===============================================================
// ROOT PROVIDERS AND NAVIGATION
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
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AttendanceDraftProvider>
      </DemoWorkspaceProvider>
    </MemberDraftProvider>
  );
}
