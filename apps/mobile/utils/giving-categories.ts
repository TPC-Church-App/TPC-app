// ===============================================================
// apps/mobile/utils/giving-categories.ts
// Group live funds into the member-facing giving choices.
// ===============================================================

export const GIVING_OPTIONS = [
  { id: 'offering', label: 'Offering', keywords: ['offerings?'] },
  { id: 'tithe', label: 'Tithes', keywords: ['tithes?'] },
  {
    id: 'property',
    label: 'Property giving',
    keywords: ['property', 'building'],
  },
  {
    id: 'mission',
    label: 'Church mission',
    keywords: ['mission(?:s|ary)?'],
  },
  {
    id: 'evangelist',
    label: 'Evangelist',
    keywords: ['evangel(?:ist|ism)'],
  },
  {
    id: 'outreach',
    label: 'Church outreach program',
    keywords: ['outreach', 'program'],
  },
] as const;

export type GivingOptionId = (typeof GIVING_OPTIONS)[number]['id'];

// ===============================================================
// TEMPORARY FUND-NAME MATCHING
// The funds table has no category column yet; the backend should add one.
// ===============================================================

export function getGivingOptionId(fundName: string): GivingOptionId | null {
  const normalizedName = fundName.toLocaleLowerCase('en-NG');
  const matchedOption = GIVING_OPTIONS.find((option) =>
    option.keywords.some((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(normalizedName),
    ),
  );

  return matchedOption?.id ?? null;
}
