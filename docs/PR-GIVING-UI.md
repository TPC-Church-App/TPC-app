# Pull request title

feat(mobile): refine giving, service and appearance UI

# Pull request description

## Problem and resulting behaviour

Giving categories and payment-history filters took too much screen space. The amount helper also described a ₦100 minimum even though the agreed member-facing rule is ₦500. This update puts fund and history choices in compact bottom sheets, validates the new minimum, and keeps a single checkout handoff preview.

In the live integration, the app will hand off once to Paystack Checkout. Paystack account configuration and customer/device eligibility determine which payment methods appear. This branch does not start a real payment.

## Changes

- Replace the giving fund cards and history filter chips with accessible compact bottom selection sheets.
- Require at least ₦500 in the frontend amount validator; show the minimum only when the entered amount is invalid.
- Keep suggested amounts at ₦500, ₦1,000, and ₦5,000.
- Add boundary coverage for ₦499, ₦499.99, ₦500, and ₦500.01.
- Update the API contract: the backend initializer currently accepts ₦100 and must independently enforce and test ₦500 before live integration.
- Keep payment methods inside the secure Paystack Checkout handoff; do not promise channels unsupported by merchant configuration or device eligibility.
- Make the Home service card expand into a Sunday-to-Saturday sample timetable.
- Show sermon themes, Bible passages, pastor notes, bookmarks and separate YouTube/Mixlr provider handoffs. Provider links are HTTPS and host-checked; none are configured for the demo.
- Add saved System/Light/Dark appearance across app screens and use the matching supplied church logo.
- Update README, manual acceptance and backend handoff records. Schedule editing, live media, provider expiry and account preferences remain server or later-integration work.

## Validation

Update this table after running commands on the current branch:

| Check                                                  | Result  |
| ------------------------------------------------------ | ------- |
| Prettier format and format:check                       | Pending |
| TypeScript                                             | Pending |
| Node tests                                             | Pending |
| Expo install check and Expo Doctor                     | Pending |
| iOS and web exports                                    | Pending |
| iPhone Giving, schedule, sermons and theme acceptance  | Pending |
| Browser Giving, schedule, sermons and theme acceptance | Pending |

## Backend follow-up

- Enforce the ₦500 minimum in the offering initializer; current code accepts ₦100.
- Agree active funds/campaigns and historical fund snapshots.
- Complete Paystack initialization, authoritative callbacks/webhook reconciliation, retries/idempotency, history and receipt contracts.
- Test eligible payment methods through Paystack Checkout for the church account and supported devices.

## Remaining backend and product follow-up

- Supply an admin-managed Sunday-through-Saturday timetable and published sermon/message content.
- Agree the official YouTube embedded or external-player behavior, Mixlr audio-only service URLs, provider terms, and 24-hour post-service expiry. The current screen opens only authorized provider URLs externally; it does not embed video or enforce expiry.
- Add profile stickers/badges for visitors, regular attendees, approved departments, and pastor/staff roles. Server authorization and agreed visibility/consent govern privileged badges.
- Add assisted attendance for a member without a device/data using an eligible verified helper, with an agreed QR/PIN flow, member consent, duplicate prevention, and server audit of both people.
- Validate the saved local appearance preference and contrast on supported iPhone and browser targets. Account-level preference sync remains pending authentication/API agreement.

This pull request provides frontend previews only. It does not implement admin controls, authenticated content, provider playback, media deletion/expiry, role authority or server preference sync.

The UI continues to use local demo records. It does not charge money, verify a payment, or provide real payment history or receipts. The previously tracked eight dependency-security findings remain open for review; this UI change does not remediate them.
