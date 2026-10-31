// ===============================================================
// apps/mobile/constants/messages.ts
// Synthetic church content, never a live announcement or notification.
// ===============================================================

export const DEMO_MESSAGES = [
  {
    id: 'welcome',
    type: 'announcements',
    title: 'A place for you',
    date: 'Sample announcement',
    body: 'Welcome to our church community. Join us for worship, prayer and fellowship. Speak with the welcome team if you need help finding your way.',
  },
  {
    id: 'weekly',
    type: 'weekly',
    title: 'Walk in faith this week',
    date: 'Sample weekly church message',
    body: 'Make room for prayer, encourage someone and carry kindness into your week. This sample message illustrates where the church will share its weekly encouragement.',
  },
  {
    id: 'outreach',
    type: 'announcements',
    title: 'Serving our neighbours',
    date: 'Sample outreach announcement',
    body: 'An outreach program could appear here with its confirmed date, location and participation details. No real event has been scheduled by this demo.',
  },
  {
    id: 'attendance',
    type: 'attendance',
    title: 'Check-in reminder',
    date: 'Sample notification',
    body: 'Attendance opens 30 minutes before service and closes 30 minutes after it ends. Pending offline evidence may upload until 24 hours after service ends.',
  },
  {
    id: 'giving',
    type: 'payments',
    title: 'Your giving history',
    date: 'Sample notification',
    body: 'Payment updates will appear here after server confirmation. Demo receipts do not prove a real payment.',
  },
  {
    id: 'department',
    type: 'departments',
    title: 'Department request updates',
    date: 'Sample notification',
    body: 'An admin decision will update departmental access and schedules. Local outcome controls only preview those screens.',
  },
] as const;
