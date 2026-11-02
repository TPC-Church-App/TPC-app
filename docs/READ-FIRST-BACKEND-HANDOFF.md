# Read first: backend handoff for the TPC member app

This document is for the backend and API team. The member UI milestone was merged into `dev` as PR #4 (`9b4d8b8`). A separate giving UI follow-up is being prepared for partner review. The mobile app currently demonstrates member journeys with local/sample data; it does not provide production authentication, attendance verification, or payments.

Before implementation, review [API-CONTRACT.md](API-CONTRACT.md), [DATABASE.md](DATABASE.md), and the current product requirements in [README.md](../README.md). Confirm the contract with the frontend owner before treating proposed fields or routes below as settled. Existing repository handlers and migrations describe current code; they do not prove the hosted project is deployed or match the confirmed product rules.

## Backend work required

1. **Authentication and member profile**
   - Agree phone OTP and email OTP request, verification, resend/cooldown, expiry, rate limits, recovery, logout, refresh, and error response contracts.
   - After a valid OTP, provision or load the member profile and grant ordinary member access immediately. Do not require usher/admin approval for ordinary sign-up or sign-in.
   - Define profile create/read/update fields and the photo upload/storage limits, ownership, deletion, and authorization rules.
   - Preserve the existing required first name, surname, and age of at least four. Address collection is not part of initial registration. Any pastoral visit address must be an optional, purpose-limited, consent-based request with agreed access, retention, and withdrawal rules.
   - Do not trust client-supplied role, department approval, verified status, member ID, or payment status.

2. **Giving and Paystack**
   - Agree the authenticated active-fund/campaign catalog, immutable history snapshots, eligibility rules, currency, status, and pagination.
   - The member-facing minimum is ₦500. The current offering initializer still accepts ₦100; update and test server validation before integrating the frontend. Enforce maximum, decimal precision, ownership, and integer-kobo conversion on the server.
   - Use one server-initialized Paystack Checkout handoff. The Paystack account configuration and customer/device eligibility determine which methods appear. Do not promise that every user can use every channel.
   - Define idempotency for initialization/retries, provider timeout and pending reconciliation, callback allow-listing, webhook signature validation, settlement, reversal/refund, and authoritative history/receipt status. The client return route is never proof of payment.
   - Keep Paystack secret keys and privileged database credentials on the server.

3. **Attendance and service operations**
   - Define service discovery, signed or otherwise unforgeable service-specific QR passes, trusted server time, and the check-in window: opens 30 minutes before service start and closes 30 minutes after service end.
   - Define offline evidence, explicit GPS consent, timestamp trust limits, upload/idempotency rules, and the 24-hour upload deadline measured from service end.
   - Define witness eligibility: a verified member who was present at that same service may confirm; usher/admin approval is not required for this witness confirmation.
   - Define pending, accepted, rejected, expired, duplicate, permission-denied, offline, retry, and conflict responses. Never treat a device timestamp or local queue as server-confirmed attendance.

   - Product has also requested assisted attendance when a member lacks a phone or data. Agree whether the helper scans a service QR, enters a service-bound usher PIN, or either. The helper must use their own verified account; record helper and member identities, enforce eligibility and duplicate prevention, and return an authoritative result. Never share accounts or make this a silent impersonation flow.

4. **Departments, messages, and other member features**
   - Define department request states and authorized approvers. Admin approval is required before departmental access/schedules; head-of-department approval remains an open product proposal.
   - Agree roster and availability permissions, notifications/preferences/read state, announcement and weekly-message content, sermon media access, badges, and both newcomer and financial-sponsorship request flows.
   - A prepared sponsorship request must not imply an approved request or promised funds.

5. **Service schedule and media**
   - Provide a published schedule from Sunday through Saturday with admin create/edit/publish/archive controls, service timezone, recurrence, and effective timestamps.
   - Define sermon/message content fields for service date, topic, theme, Bible passages, pastor notes, media URLs, publication time, and a trusted server-derived media-availability decision/expiry.
   - The Home now has an expandable Sunday-to-Saturday demo timetable; only its sample Sunday service has data. Agree official YouTube remote/embed behavior and Mixlr audio-only live channel/player integration, including supported clients and failure/offline UI. The member screen currently hands authorized HTTPS provider links to the external app/browser; it does not embed video.
   - Enforce the requested 24-hour visibility/retention window after service end. Decide whether this means app listing expiry, provider recording deletion, or both; a hidden UI link does not delete provider media.
   - Ensure media is authorized and use official provider players; do not rehost media without rights.

6. **Profile badges and access**
   - Define visitor, regular attendee, department, pastor/staff badge values, provenance, visibility/consent, revocation, and expiry. The server assigns privileged roles; never trust client-edited badges.

7. **Settings and appearance**
   - Agree account/session, privacy, notification, and accessibility settings behavior.
   - The frontend now provides a saved local System/Light/Dark appearance choice across auth, tabs, menus, sheets, loaders, bars, forms, and empty/error states, using the provided dark logo and respecting reduced motion. This remains device demo state, not a member account preference.

## Frontend acceptance requested from the backend team

Please run the member app against agreed test/staging APIs and report each result to the frontend owner. Use synthetic accounts and provider test mode only.

- Check registration, phone/email OTP, invalid/expired codes, resend limits, session creation, profile loading/editing, logout, and sign-in persistence.
- Check fund selection, amount boundaries including ₦499.99 and ₦500, disabled/inactive campaigns, secure checkout handoff, each method enabled for the test account/device, provider cancellation/failure/pending/success, webhook reconciliation, retry, duplicate callback, history, and receipt eligibility.
- Check service QR expiry/window boundaries, location consent and denial, manual/witness paths, duplicate scans, offline queue persistence, upload before/after the 24-hour deadline, retry, rejection, and member-visible history.
- Check department pending/approved/rejected access; announcements, notifications and preferences; photo permissions; narrow screens, large text, keyboard, screen reader labels, reduced motion, and network failure/recovery.
- Check the expandable Home timetable and sample Sunday entry, then validate the published schedule contract and admin edits after backend integration. Check YouTube/Mixlr provider handoffs, pastor notes and 24-hour expiry against authorized test links and server policy. Confirm the media is hidden after expiry; provider deletion requires a separate policy.
- Check visitor/regular/department/pastor badge visibility and revocation, assisted check-in actor/member audit, and System/Light/Dark appearance including the correct logo and contrast.
- Verify that successful UI indicators appear only after an authoritative server response. Pending, timeout, callback navigation, or local demo state must not show a verified success state.

Record the environment, app branch/commit, test accounts (never passwords or OTP secrets), API version, expected result, actual result, and defects. The frontend owner will handle client integration and UI changes; backend routes, secrets, database policy, migrations, webhooks, and production configuration belong to the backend owner.

## Release boundary

The demo supports UI review and contract testing only. It does not send OTPs, charge payments, confirm attendance, contact invitees, deliver push notifications, or grant real staff/department permissions. Resolve or formally assess the tracked dependency advisories, validate backend authorization and data retention, and complete staging acceptance before production release.
