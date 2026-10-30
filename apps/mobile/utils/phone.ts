// ===============================================================
// apps/mobile/utils/phone.ts
// Format national/international input and validate complete numbers.
// No network calls or contact ownership checks happen here.
// ===============================================================

import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max';

type PhoneValidation =
  | {
      valid: true;
      internationalNumber: string;
      displayNumber: string;
      country: CountryCode | undefined;
    }
  | {
      valid: false;
      message: string;
    };

// ===============================================================
// DISPLAY FORMATTING
// Preserve local prefixes such as Nigeria's leading zero.
// An explicit + prefix identifies international input.
// ===============================================================

export function formatPhoneInput(value: string, country: CountryCode): string {
  // Preserve unsupported characters so validation can reject them.
  if (!/^[+\d\s().-]*$/.test(value)) {
    return value;
  }

  return new AsYouType(country).input(value);
}

// ===============================================================
// COMPLETE NUMBER VALIDATION
// Keep formatted display separate from the future API value.
// ===============================================================

export function validatePhoneInput(
  value: string,
  country: CountryCode,
): PhoneValidation {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, message: 'Enter your phone number.' };
  }

  if (!/^\+?[\d\s().-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Enter a phone number using digits and an optional leading +.',
    };
  }

  const phone = parsePhoneNumberFromString(trimmed, {
    defaultCountry: country,
    extract: false,
  });

  if (!phone || phone.ext || !phone.isValid()) {
    return {
      valid: false,
      message: 'Enter a valid phone number and check the selected country.',
    };
  }

  return {
    valid: true,
    internationalNumber: phone.number,
    displayNumber: trimmed.startsWith('+')
      ? phone.formatInternational()
      : phone.formatNational(),
    country: phone.country,
  };
}
