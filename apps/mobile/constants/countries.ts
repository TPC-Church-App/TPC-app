// ===============================================================
// apps/mobile/constants/countries.ts
// Define the supported phone-country choices.
// This is a selected coverage list, not an economic/population rank.
// ===============================================================

import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

type PhoneCountry = {
  code: CountryCode;
  name: string;
};

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'NG';

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

// ===============================================================
// COUNTRY LABELS
// Include names because countries can share a calling code.
// ===============================================================

export function getPhoneCountryLabel(country: PhoneCountry): string {
  return `${country.name} (+${getCountryCallingCode(country.code)})`;
}
