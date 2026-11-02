# Member UI change history

## 30 October 2026 — member demo milestone (merged into `dev`)

Branch: `chore/member-home-ui`. The partner merged PR #4 into `dev` on 2 November 2026 (merge commit `9b4d8b8`; member UI commit `3a3ef9d`). The assistant did not perform the merge.

### Member journeys

- Upgraded the mobile package from Expo SDK 57 to SDK 58 for Expo Go compatibility, aligned native modules and added the device modules used by the member demo.

- Expanded the cream/gold TPC welcome flow into member-details registration, phone/email contact entry, country formatting and guarded demo OTP verification with 123456.
- Required first name, surname and age four or above; ordinary app access does not require usher/admin approval.
- Added Home/Profile tabs plus a navigable member menu. Other feature routes stay accessible without becoming visible bottom tabs.
- Added editable Profile, native photo selection/copy, explicit device-profile save/load, Settings, notification preferences and confirmed demo-data reset.
- Added department request summaries, progress and pending/approved/rejected demo outcomes. Department schedules and worker availability/approval previews remain separate from ordinary member access.
- Added announcements, message details, weekly church messages, read/unread state and a preference-filtered notification inbox.
- Added sample sermon entries and bookmarks. The bundled test tone was removed in the 2 November follow-up and replaced by provider handoff previews; no real sermon recording is claimed.
- Added demo badges, newcomer invitations and financial-sponsorship requests. Prepared requests do not contact anyone or promise funding.
- Added a shared sample service, QR/manual-code scanner, permission-based GPS evidence, witness requests/eligible-member confirmation, persistent native attendance queue, history, retry and confirmed/rejected/expired demo views.
- Added separate Giving, Checkout, Payment Return, Payment History and Receipt interfaces. Funds/categories include offering, tithes, property, voluntary giving and a sample outreach campaign.
- Added owned DEMO references and all documented payment status views. Return navigation alone cannot mark a payment successful. Receipts require a successful saved demo payment; reversals remove eligibility.
- Retained development-only access and clearly labelled local outcomes. No live authentication, payments, attendance verification, staff authority or message/push delivery was connected.

### Review corrections

- Aligned Home and Attendance sample-service times and improved text contrast on the gold card.
- Added async guards around camera/location/photo/checkout operations and reduced-motion behaviour.
- Corrected filename/purpose banners and section labels across frontend modules. Reviewed 76 source/test files and changed comments in 53; 15 parked files now identify their inactive status and correct path. Backend logic was not changed.
- Unified first-name and surname validation at 100 characters; surnames of 81–100 characters no longer conflict with the form limit.
- Blocked normal saves after failed hydration of profile, workspace or attendance data. Added non-destructive retry and an explicit recovery reset.
- Extracted the native persistence core behind an injectable adapter. Serialized reads/writes/resets, retained the old committed snapshot on interrupted writes, and allowed explicit reset of malformed metadata.
- Displayed reset failures inside the open confirmation sheet.
- Reapplied an explicit Community section on focus so repeated department-schedule shortcuts select the correct tab.
- Rechecked playback validity after configuration and seek. Blur/background/new operations invalidate pending playback.
- Expanded Prettier scripts to include parked routes, admin scaffolds, root package configuration and documentation alongside the active mobile source.
- Updated README status, acceptance instructions, API handoff notes and the detailed PR description.

### Verification record

| Snapshot/check                    | Evidence                                                                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before the final functional fixes | User reported that format:check, TypeScript and all original 23 tests passed.                                                                                                                                                                                          |
| Current source                    | Prettier library formatting and syntax/import/header cross-checks performed without terminal commands.                                                                                                                                                                 |
| Current regression inventory      | 41 cases: 7 attendance, 16 member demo, 18 recovery/lifecycle. New cases and strengthened name-boundary assertions are awaiting manual execution.                                                                                                                      |
| Current terminal checks           | Before the latest giving UI edits, supplied output confirmed formatting, TypeScript, 41 tests, SDK alignment, Doctor 20/20 and both iOS/web exports. The user confirmed iPhone and browser acceptance for the merged milestone. Eight dependency findings remain open. |
| Device/browser acceptance         | Awaiting user confirmation for the final snapshot.                                                                                                                                                                                                                     |
| Dependency audit                  | A fresh manual npm audit remains required; no advisory is marked fixed by UI work.                                                                                                                                                                                     |

This history records source changes and verification evidence. It does not claim a deployed application, a complete staff dashboard or approved backend contracts.

### Expo peer dependency follow-up

Expo Doctor identified expo-asset as a required direct dependency of expo-audio. The Expo SDK 58 metadata selects its compatible release through expo install. Manual installation and subsequent Doctor/export checks remain pending. The earlier guard stopped before either export or the audit. Node emitted MODULE_TYPELESS_PACKAGE_JSON notices, but all 41 tests passed; no module-mode change is made as part of this peer fix.

### Verified Expo exports and current audit

The user installed expo-asset through Expo, passed the SDK alignment check and Expo Doctor 20/20, and completed both iOS and web Metro exports. The new audit reports eight affected-package findings (five low, three high) from deepmerge and Zod. Security remediation/assessment remains open; the forced Expo 51 downgrade is not accepted. The user later confirmed phone and browser acceptance passed for the merged milestone.

### Security dry-run follow-up

The user ran npm audit fix --dry-run --ignore-scripts. The preview still reported eight findings (five low, three high) and proposed the same forced Expo 51 downgrade for full remediation. No compatible remediation of these advisories was identified by that run, and no package changes were applied. The findings remain open for partner security review; this is not production risk acceptance.

## 31 October 2026 — final device acceptance

The user confirmed that both iPhone and browser acceptance passed for the merged milestone. This is manually reported acceptance, not an automated UI test result. Formatting, TypeScript, all 41 tests, Doctor 20/20 and iOS/web exports were confirmed by supplied output for that milestone. Eight dependency-security findings remain unresolved.

## 2 November 2026 — giving and payment-history UI follow-up

- Replaced giving category cards and history filter chips with compact bottom selection sheets.
- Changed the frontend amount minimum from ₦100 to ₦500, kept the minimum out of normal helper copy, and added boundary cases for ₦499, ₦499.99, ₦500 and ₦500.01.
- Updated the API contract to state that ₦500 is the product target while the current backend handler still accepts ₦100; server enforcement and tests remain partner work.
- Kept one checkout handoff preview. In production, Paystack Checkout and account/device eligibility determine which payment methods appear. The current screen starts no real payment.
- Normalized sample Home copy.
- Current snapshot checks and iPhone/browser acceptance are pending after these latest UI changes. No commit, push or new pull request has been made for this follow-up.

## 2 November 2026 — service content and appearance UI follow-up

- Made the Home service card expand and collapse an accessible Sunday-to-Saturday timetable. It shows the current local sample service on Sunday and labels unsupplied days as having no sample entry. Admin edits and published services still need backend data and permissions.
- Replaced the bundled six-second test tone with a sermon detail preview for theme, Bible passages and pastor notes, plus separate YouTube video and Mixlr audio-only handoff buttons.
- Restricted future media handoffs to HTTPS URLs on their matching provider domains. No real URLs, embedded player, Mixlr stream, admin content feed or server expiry is connected; the 24-hour-after-service-end policy currently appears as explanatory UI only.
- Added persisted System/Light/Dark appearance preference to the device demo workspace, applied the matching palette through auth and member screens/components, and selected the corresponding supplied church logo. Existing saved workspaces without an appearance field default to System.
- Updated README, backend handoff, manual acceptance plan and current PR draft to distinguish shipped demo UI from server responsibilities.
- Prettier, TypeScript, tests, Expo checks/exports and visual acceptance have not been run for this snapshot. The user must run the supplied manual commands and confirm iPhone/browser appearance and navigation before commit or push.
