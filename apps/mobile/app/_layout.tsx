// ===============================================================
// File: apps/mobile/app/_layout.tsx
// Description: Root providers, typography loading, and splash screen handoff.
// Author: Josiah Ewumi
// ===============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { AttendanceDraftProvider } from '@/store/attendance-draft';
import { DemoWorkspaceProvider } from '@/store/demo-workspace';
import { MemberDraftProvider } from '@/store/member-draft';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    void AsyncStorage.getItem('tpc.remember_me')
      .then((value) => {
        if (value === 'false') {
          return supabase.auth.signOut({ scope: 'local' });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
