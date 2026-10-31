// ===============================================================
// apps/mobile/constants/member-pages.ts
// Every menu entry maps to a real, navigable member-demo route.
// ===============================================================

export const MEMBER_PAGES = {
  settings: { title: 'Settings', description: 'Device demo preferences' },
  giving: { title: 'Giving', description: 'Demo funds and checkout' },
  history: {
    title: 'Payment history',
    description: 'Saved demo outcomes and receipts',
  },
  messages: {
    title: 'Messages & notifications',
    description: 'Sample church messages and updates',
  },
  attendance: {
    title: 'Attendance',
    description: 'Service scanner, history and offline queue',
  },
  sermons: {
    title: 'Sermons',
    description: 'Teaching library and audio controls',
  },
  community: {
    title: 'Church community',
    description: 'Badges, sponsor invitations and department schedules',
  },
} as const;

// ===============================================================
// MENU ROUTE MAPPING
// ===============================================================

export const MEMBER_ROUTES = {
  home: '/(tabs)/home',
  profile: '/(tabs)/profile',
  settings: '/(tabs)/settings',
  giving: '/(tabs)/giving',
  history: '/(tabs)/history',
  messages: '/(tabs)/messages',
  attendance: '/(tabs)/attendance',
  sermons: '/(tabs)/sermons',
  community: '/(tabs)/community',
} as const;
