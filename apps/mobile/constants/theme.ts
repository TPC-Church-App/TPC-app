// ===============================================================
// File: apps/mobile/constants/theme.ts
// Description: Unified Warm Ivory & Gold design tokens for TPC mobile.
// Author: Josiah Ewumi
// ===============================================================

import { Platform } from 'react-native';

export const colors = {
  background: '#FDF9F0',
  surface: '#FFFFFF',
  primary: '#C4912A',
  primaryPressed: '#A37319',
  text: '#161B29',
  secondaryText: '#6E6A63',
  border: '#E5DAC5',
  onPrimary: '#FFFFFF',
  decorativeBorder: '#EDE4D3',
  link: '#A4741A',
  error: '#B42318',
  success: '#236B41',
} as const;

export const palette = {
  canvas: '#FDF9F0',
  surface: '#FFFFFF',
  surfaceWarm: '#FFFDF9',
  surfaceMuted: '#F6EFE0',
  surfaceBadge: '#F4ECDA',
  inkNavy: '#131B2E',
  textPrimary: '#161B29',
  textSecondary: '#6E6A63',
  textMuted: '#9A9387',
  gold: '#C4912A',
  goldDark: '#9A6914',
  goldText: '#A4741A',
  goldIcon: '#B07D1E',
  borderSubtle: '#EDE4D3',
  borderInput: '#E8DEC9',
  heroGradient: ['#D7A43B', '#B5811F', '#8F5E0E'] as const,
  buttonGradient: ['#D4A036', '#B5801C'] as const,
  whiteOverlay: 'rgba(255, 255, 255, 0.16)',
  whiteOverlayBorder: 'rgba(255, 255, 255, 0.58)',
  arcPrimary: 'rgba(229, 198, 135, 0.22)',
  arcSecondary: 'rgba(229, 198, 135, 0.12)',
  arcStroke: 'rgba(218, 180, 108, 0.16)',
  successSoft: '#EAF5EE',
  errorSoft: '#FEF2F2',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  hero: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#8A6620',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#8A6620',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
  }),
  hero: Platform.select({
    ios: {
      shadowColor: '#8F5E0E',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#8F5E0E',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
    },
  }),
  tabBar: Platform.select({
    ios: {
      shadowColor: '#8A6620',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#8A6620',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
  }),
} as const;
