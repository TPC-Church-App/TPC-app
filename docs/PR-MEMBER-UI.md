# Pull request title

feat(mobile): add member demo journeys and reliable local persistence

# Pull request description

## Problem and resulting behaviour

The member frontend previously stopped at onboarding previews, read-only profile information, illustrative payment history and attendance evidence that disappeared on reload. This branch provides navigable member demo journeys and saved device state while preserving TPC branding. The backend remains a separate integration milestone.

Examples: a member can save and explicitly reload a device demo profile; a QR/manual service attempt retains its original timestamp and deadline; and a reviewed gift can progress through a local checkout/return scenario into separate history and an eligible demo receipt. A failed saved-data read blocks normal writes rather than replacing previous records with empty defaults.

## Changes for review

| Area                    | Behaviour                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expo and tooling        | Align the mobile package with Expo SDK 58 and current Expo Go; add the camera/location/photo, secure persistence, file and audio modules needed by the demos. Expand Prettier coverage to active and parked frontend source, admin scaffolds, configuration and documentation. |
| Onboarding and identity | Member details before contact entry; age four or above; phone/email and country formatting; demo OTP 123456; no usher/admin gate for ordinary access.                                                                                                                          |
| Navigation and branding | Home/Profile bottom tabs, shared member menu, preserved cream/gold palette/logo, shared sample schedule and reduced-motion loaders. Hidden destinations remain navigable.                                                                                                      |
| Profile and Settings    | Edit/apply/save, explicit saved-device-profile loading, copied native photos, notification preferences, guarded reset and visible retry/error feedback.                                                                                                                        |
| Departments and workers | Compact request/progress summaries, pending/approved/rejected demo outcomes, sample schedules and saved worker availability/approval previews. No staff role is granted.                                                                                                       |
| Messages                | Announcement list/details, weekly messages, notification inbox, saved read state and category preferences.                                                                                                                                                                     |
| Sermons and community   | Teaching samples and bundled test-audio controls; session bookmarks; demo badges; both newcomer and financial-sponsorship request forms.                                                                                                                                       |
| Attendance              | Camera/manual sample pass, consent-based GPS or an eligible same-service witness, native saved queue/history, deadlines and explicit sync/error/result scenarios.                                                                                                              |
| Giving                  | Offering/tithe/property/general/program fixtures, exact integer-kobo validation, review and owned DEMO checkout references.                                                                                                                                                    |
| Payment return/history  | Explicit local outcomes for pending, ongoing, processing, queued, successful, failed, abandoned and reversed. Separate category/status history; repeated callbacks cannot duplicate records or revive terminal failures.                                                       |
| Receipts                | Only successful saved demo records display a receipt. It states that no real payment was made; reversal removes eligibility.                                                                                                                                                   |
| Documentation/comments  | Filename/purpose banners, section comments, corrected inactive-route paths, expanded frontend/config/documentation formatting, README status/history, acceptance plan and API handoff requirements.                                                                            |

## Functional review fixes

1. Both name fields accept up to 100 characters consistently.
2. Failed profile/workspace/attendance hydration blocks ordinary saves. Retry preserves data; reset is a deliberate separate action.
3. Corrupt native metadata can be reset without parsing it as a valid old manifest. Interrupted chunk/manifest writes preserve the last committed snapshot.
4. Returning to Community via a schedule shortcut reapplies the requested section on focus.
5. Audio configuration/seek cannot start playback after navigation, backgrounding or replacement by a newer operation.

## Verification

The user reported passing format:check, TypeScript and 23 original tests before the final functional fixes. That result does not validate the later edits.

Current static checks: Prettier library formatting, syntax parsing, local imports/assets and comment headers reviewed. The assistant ran no terminal commands.

**Current post-fix verification evidence:**

| Check                                 | Current result                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| format and format:check               | Passed — user-supplied post-fix terminal output                                                        |
| typecheck                             | Passed — user-supplied post-fix terminal output                                                        |
| Node regression suite — 41 cases      | Passed — 41 passed, 0 failed, 0 skipped                                                                |
| Expo install --check / Expo Doctor    | Passed — alignment confirmed and Doctor 20/20 after installing the expo-asset peer                     |
| iOS and web exports                   | Passed — both local Metro exports completed in user-supplied output                                    |
| Fresh npm audit                       | Completed — 8 affected-package findings (5 low, 3 high), from deepmerge and Zod advisories; unresolved |
| iPhone/Expo Go and browser acceptance | Passed — user confirmed both on 31 October 2026; manually reported acceptance                          |

Regression source covers timing/deadlines, duplicate protection, profile and money validation, witness eligibility, payment ownership/replay/receipts, route-file existence, chunk/manifest failures, corrupt reset, serialization, write gating and async playback cancellation. It does not replace native permission, visual/accessibility or real API testing.

## Backend handoff and limits

- Everything added here uses labelled demo data. No real OTP/session, checkout, provider callback, payment receipt, attendance confirmation, department authority, sponsorship delivery or push notification is connected.
- Native profile text/attendance evidence use SecureStore; native photos use app documents. Web storage excludes retained GPS; photos and sermon bookmarks have the documented session limitations.
- A saved device profile is not selected or authenticated by the phone/email entered at sign-in.
- Live code-sent ticks must wait for the agreed provider/server sending state. Verification ticks require the correct-code response and authenticated session. Attendance, approval and payment success also require authoritative responses.
- API request/response/error shapes, active fund/campaign catalog, histories/receipts, witness evidence, content/media, department/roster decisions and notification semantics still need agreement with the backend owner. Proposed fields in API-CONTRACT.md are not available endpoints.
- The current backend legacy membership gate conflicts with immediate ordinary access after OTP verification; the backend owner must reconcile that policy before integration.
- Staff web dashboard, production integration, distribution artwork and release validation remain separate work. This PR does not declare the entire application complete.

## Reviewer focus

Review saved-data recovery/reset, route shortcuts, camera/photo/location/audio lifecycle, witness and deadline enforcement, callback ownership/replay rules and receipt eligibility. Compare data assumptions with API-CONTRACT.md. Use MEMBER-UI-TEST-PLAN.md for acceptance and MEMBER-UI-CHANGELOG.md for the milestone history.

Base branch: dev. Compare branch: chore/member-home-ui. Wait for partner review before merge or a new branch.

## Open dependency-security review

The current user-run SDK 58 audit reports eight affected-package findings (five low, three high), with two underlying advisories: deepmerge@4.3.1 via @expo/config (GHSA-gcqx-w48m-w2h4, prototype poisoning; advisory currently lists no patched version), and zod@3.25.76 via Expo CLI (GHSA-mrhx-c7xc-m3w5, memory exhaustion; advisory lists 4.6.6 as patched). Expo CLI currently declares Zod ^3.25.76, so forcing Zod 4 is not a validated compatible fix.

The audit proposes expo@51.0.39 with --force, which would downgrade the SDK 58 project. That is not the approved remediation. Preview ordinary compatible fixes without changing files, then assess an Expo-supported update or reviewed patch. Current dependency-chain evidence identifies tooling paths; deployed-bundle reachability and attacker-controlled input exposure have not been established. Local demo work can continue with tracked findings and restricted exposure, but no production security acceptance is recorded. Partner review is required before release.

References: [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

### Compatible-remediation preview result

The user ran npm audit fix --dry-run --ignore-scripts. The preview still reported eight findings (five low, three high) and proposed the same forced Expo 51 downgrade for full remediation. No compatible remediation of these advisories was identified by that run, and no package changes were applied. The findings remain open for partner security review; this is not production risk acceptance.
