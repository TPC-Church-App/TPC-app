// ===============================================================
// apps/mobile/utils/giving.ts
// Work in integer kobo and accept at most two decimal places.
// Limits match the current payment handler, not a new product policy.
// Parsing uses O(n) time/space for the entered text.
// ===============================================================

export const MIN_GIVING_NAIRA = 100;
export const MAX_GIVING_NAIRA = 1_000_000;

type AmountResult =
  { valid: true; amountMinor: number } | { valid: false; message: string };

// ===============================================================
// VALIDATE NAIRA INPUT AS INTEGER KOBO
// ===============================================================

export function parseGivingAmount(input: string): AmountResult {
  const value = input.trim();

  if (!value) return { valid: false, message: 'Enter an amount to give.' };

  if (
    value.length > 24 ||
    !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value)
  ) {
    return {
      valid: false,
      message:
        'Enter an amount such as 1000 or 1,000.50, with at most two decimals.',
    };
  }

  const [wholeText, fraction = ''] = value.replace(/,/g, '').split('.');
  const whole = Number(wholeText);

  if (!Number.isSafeInteger(whole) || whole > MAX_GIVING_NAIRA) {
    return { valid: false, message: 'Enter between ₦100 and ₦1,000,000.' };
  }

  const amountMinor = whole * 100 + Number(fraction.padEnd(2, '0'));

  if (
    amountMinor < MIN_GIVING_NAIRA * 100 ||
    amountMinor > MAX_GIVING_NAIRA * 100
  ) {
    return { valid: false, message: 'Enter between ₦100 and ₦1,000,000.' };
  }

  return { valid: true, amountMinor };
}

// ===============================================================
// PAYMENT AMOUNT AND DATE PRESENTATION
// ===============================================================

const moneyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatGivingAmount(amountMinor: number): string {
  return moneyFormatter.format(amountMinor / 100);
}

export function formatGivingDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}
