// ===============================================================
// apps/mobile/constants/giving.ts
// Local giving fixtures. Demo IDs are not backend fund UUIDs.
// Backend integration must load active, administrator-managed funds.
// Payment records retain the fund name/category from their creation.
// ===============================================================

export const GIVING_CATEGORIES = {
  offering: 'Offering',
  tithe: 'Tithes',
  property: 'Property giving',
  general: 'From the heart',
  program: 'Programs & outreach',
} as const;

export type GivingCategory = keyof typeof GIVING_CATEGORIES;
export type GivingStatus =
  | 'successful'
  | 'pending'
  | 'failed'
  | 'abandoned'
  | 'ongoing'
  | 'processing'
  | 'queued'
  | 'reversed';

export type GivingFund = {
  id: string;
  name: string;
  description: string;
  category: GivingCategory;
  isActive: boolean;
};

export type GivingRecord = {
  id: string;
  fundId: string;
  fundName: string;
  category: GivingCategory;
  amountMinor: number;
  currency: 'NGN';
  status: GivingStatus;
  createdAt: string;
  reference: string;
};

export const GIVING_STATUS_LABELS: Record<GivingStatus, string> = {
  successful: 'Successful',
  pending: 'Pending',
  failed: 'Failed',
  abandoned: 'Abandoned / cancelled',
  ongoing: 'Ongoing',
  processing: 'Processing',
  queued: 'Queued',
  reversed: 'Reversed',
};

// ===============================================================
// DEMO FUNDS AND CAMPAIGNS
// ===============================================================

export const GIVING_FUNDS: readonly GivingFund[] = [
  {
    id: 'demo-offering',
    name: 'Offering',
    description: 'Give towards the life and work of the church.',
    category: 'offering',
    isActive: true,
  },
  {
    id: 'demo-tithe',
    name: 'Tithes',
    description: 'Set aside your tithe as an act of faith.',
    category: 'tithe',
    isActive: true,
  },
  {
    id: 'demo-property',
    name: 'Property giving',
    description: 'Support church property and building projects.',
    category: 'property',
    isActive: true,
  },
  {
    id: 'demo-general',
    name: 'From the heart',
    description: 'A voluntary gift, freely given from your heart.',
    category: 'general',
    isActive: true,
  },
  {
    id: 'demo-outreach',
    name: 'Community outreach',
    description: 'An example of a campaign the church could make available.',
    category: 'program',
    isActive: true,
  },
];

// Illustrations only: never merge these into a member's real history.

// ===============================================================
// OPTIONAL PAYMENT HISTORY ILLUSTRATIONS
// ===============================================================

export const SAMPLE_GIVING_RECORDS: readonly GivingRecord[] = [
  {
    id: 'sample-1',
    fundId: 'demo-offering',
    fundName: 'Offering',
    category: 'offering',
    amountMinor: 500_000,
    currency: 'NGN',
    status: 'successful',
    createdAt: '2026-10-29T09:30:00+01:00',
    reference: 'DEMO-TPC-OFFERING-001',
  },
  {
    id: 'sample-2',
    fundId: 'demo-tithe',
    fundName: 'Tithes',
    category: 'tithe',
    amountMinor: 2_000_000,
    currency: 'NGN',
    status: 'successful',
    createdAt: '2026-10-25T10:00:00+01:00',
    reference: 'DEMO-TPC-TITHE-002',
  },
  {
    id: 'sample-3',
    fundId: 'demo-property',
    fundName: 'Property giving',
    category: 'property',
    amountMinor: 1_000_000,
    currency: 'NGN',
    status: 'pending',
    createdAt: '2026-10-24T12:15:00+01:00',
    reference: 'DEMO-TPC-PROPERTY-003',
  },
  {
    id: 'sample-4',
    fundId: 'demo-general',
    fundName: 'From the heart',
    category: 'general',
    amountMinor: 250_000,
    currency: 'NGN',
    status: 'failed',
    createdAt: '2026-10-22T14:00:00+01:00',
    reference: 'DEMO-TPC-GENERAL-004',
  },
  {
    id: 'sample-5',
    fundId: 'demo-outreach',
    fundName: 'Community outreach',
    category: 'program',
    amountMinor: 750_000,
    currency: 'NGN',
    status: 'successful',
    createdAt: '2026-10-20T11:45:00+01:00',
    reference: 'DEMO-TPC-OUTREACH-005',
  },
];
