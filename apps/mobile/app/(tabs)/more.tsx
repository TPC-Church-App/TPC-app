// ===============================================================
// apps/mobile/app/(tabs)/more.tsx
// Backward-compatible links from earlier demo navigation.
// ===============================================================

import { Redirect, useLocalSearchParams } from 'expo-router';
import { MEMBER_ROUTES } from '@/constants/member-pages';

// ===============================================================
// LEGACY MENU REDIRECTION
// ===============================================================

export default function MoreScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const destination = MEMBER_ROUTES[section as keyof typeof MEMBER_ROUTES];
  return <Redirect href={destination || '/(tabs)/home'} />;
}
