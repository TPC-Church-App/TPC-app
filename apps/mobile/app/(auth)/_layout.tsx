// ===============================================================
// File: apps/mobile/app/(auth)/_layout.tsx
// Description: Full-bleed Warm Ivory stack for auth & onboarding screens.
// Author: Josiah Ewumi
// ===============================================================

import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
