// ===============================================================
// apps/mobile/constants/theme.ts
// Keep the cream-and-gold brand consistent in light and dark appearances.
// ===============================================================

import { createContext, useContext } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export const lightColors = {
  background: '#FFF8ED',
  surface: '#FFFFFF',
  primary: '#CAA345',
  primaryPressed: '#AF8932',
  text: '#302D29',
  secondaryText: '#746B5C',
  border: '#96866B',
  onPrimary: '#302719',
  decorativeBorder: '#EADCC4',
  link: '#806019',
  error: '#A12622',
  success: '#236B41',
  onScanner: '#FFF8ED',
} as const;

export const darkColors = {
  background: '#171613',
  surface: '#24221D',
  primary: '#CAA345',
  primaryPressed: '#AF8932',
  text: '#F5F0E6',
  secondaryText: '#C4BAA8',
  border: '#82775F',
  onPrimary: '#241D10',
  decorativeBorder: '#494335',
  link: '#E0C16D',
  error: '#FF9B91',
  success: '#79D79A',
  onScanner: '#FFF8ED',
} as const;

export type ThemeColors = {
  [Key in keyof typeof lightColors]: string;
};

export const ThemeContext = createContext({
  colors: lightColors as ThemeColors,
  preference: 'system' as ThemePreference,
  scheme: 'light' as 'light' | 'dark',
});

export function useAppTheme() {
  return useContext(ThemeContext);
}
