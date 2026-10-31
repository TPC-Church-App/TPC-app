# TPC Church App

Member participation, giving and church communication for The Pentecostal Congregation.

TPC Church App comprises a member mobile application and a planned web dashboard for authorized church staff.

**Current stage:** Member frontend demo milestone; backend integration and release verification remain separate work.

**Working mobile interface:** Branded onboarding and demo OTP; Home, editable/saved device Profile and photos, department review outcomes, Settings, Messages/Notifications, Sermons/player, Community badges and both sponsor invitation types, worker schedules, attendance scanner/history/witness/offline queue, and demo checkout/return/payment history/receipts.

**Authentication status:** Supabase Auth integration pending. The application does not send OTP codes or create authenticated sessions.

**Release status:** Development only.

## Project responsibilities

| Contributor | Responsibility        |
| ----------- | --------------------- |
| Josiah      | Frontend / UI/UX Lead |
| John        | Backend / DevOps Lead |

Confirmed requirements appear in the Version 1 scope below. Older documents contain conflicting version labels and narrower feature lists; those do not override confirmed requirements.

Design references are incomplete templates. Missing screens and behaviours still require design and implementation.

## Architecture

| Area               | Technology                                         | Current state                                                                        |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Member application | React Native, Expo SDK 58, Expo Router, TypeScript | Runnable frontend previews; live authentication and payments pending                 |
| Country selector   | @react-native-picker/picker                        | 28-country selector; wheel interface on iPhone                                       |
| Phone handling     | libphonenumber-js                                  | Country-aware formatting and numbering-pattern validation                            |
| Staff dashboard    | Planned Next.js App Router                         | Comment-only placeholders; package initialization pending                            |
| Database           | Supabase PostgreSQL                                | Initial schema, seed data and hardening migration                                    |
| Authentication     | Planned Supabase phone and email OTP               | Configuration and integration pending                                                |
| Custom backend     | TypeScript / Supabase Edge Functions               | Payment handlers and shared helpers                                                  |
| Payments           | Paystack                                           | Initialization, verification and webhook implementation; live integration unverified |
| Live updates       | Planned Supabase Realtime                          | Application integration pending                                                      |
| Shared packages    | Reserved types, configuration and UI directories   | Not configured as installable packages                                               |

Backend functions use Deno APIs. The project does not currently contain an Express application server.

The root package manages Supabase tooling. The mobile package has its own dependencies and lockfile. npm workspaces and shared-package builds are not configured. A Turbo pipeline is not required for the current mobile application.

## Repository structure

```text
TPC-app/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── register.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── otp.tsx
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx
│   │   │       ├── home.tsx
│   │   │       ├── profile.tsx
│   │   │       ├── giving.tsx
│   │   │       ├── history.tsx
│   │   │       ├── attendance.tsx
│   │   │       ├── scanner.tsx
│   │   │       ├── settings.tsx / messages.tsx
│   │   │       ├── sermons.tsx / community.tsx
│   │   │       ├── checkout.tsx / payment-return.tsx / receipt.tsx
│   │   │       └── more.tsx
│   │   ├── planned-routes/
│   │   │   ├── (auth)/
│   │   │   │   └── _layout.tsx
│   │   │   ├── (tabs)/
│   │   │   ├── check-in/
│   │   │   └── give/
│   │   ├── assets/
│   │   │   ├── light/church-logo.png
│   │   │   └── dark/church-logo.png
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── shared/
│   │   ├── constants/
│   │   │   ├── countries.ts
│   │   │   └── theme.ts
│   │   ├── utils/
│   │   │   └── phone.ts
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── .gitignore
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   └── tsconfig.json
│   └── admin/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── (auth)/login/
│       │   └── (dashboard)/
│       │       ├── layout.tsx
│       │       ├── dashboard/
│       │       ├── attendance/
│       │       ├── members/
│       │       ├── services/
│       │       ├── offerings/
│       │       ├── reports/
│       │       └── settings/
│       ├── components/
│       │   ├── ui/
│       │   └── shared/
│       ├── lib/
│       └── public/
├── packages/
│   ├── types/
│   ├── config/
│   └── ui/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   ├── offerings-initialize/
│   │   ├── offerings-verify/
│   │   └── paystack-webhook/
│   ├── migrations/
│   │   ├── 20261021194959_initial_schema.sql
│   │   └── 20261022090000_harden_access_and_payments.sql
│   ├── tests/
│   │   └── access_and_payment_regression.sql
│   ├── config.toml
│   └── seed.sql
├── docs/
│   ├── API-CONTRACT.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Generated dependencies, Expo caches and Git internals are omitted.

`.gitkeep` preserves empty directories. The presence of a directory or placeholder does not indicate a completed feature.

Active routes now cover the member demo journeys listed below. `planned-routes` contains older parked placeholders; those files are not discoverable application screens. The admin files remain placeholders.

## Mobile frontend

### Implemented interface

The current preview supports:

- A branded opening screen with the church logo, cream/gold palette, tagline and Get started button.
- Navigation from Get started to member details, contact and demo verification; returning users can choose Sign in.
- Arrow-only back navigation on iPhone.
- Switching between phone and email entry.
- A 28-country phone selector, defaulting to Nigeria.
- Local Nigerian numbers such as `0701 234 5678`.
- International numbers such as `+234 701 234 5678`.
- Country-aware phone formatting and complete-number pattern validation.
- Basic email-format validation.
- Local error messages and feedback clearing when input changes.
- An Enter button that validates contact input before opening the verification preview.
- A six-digit verification-code field with local length validation.
- An iPhone Done toolbar for dismissing the keyboard.

Country names accompany calling codes because multiple countries can share a code.

Manually changing countries clears the phone input and previous feedback. Switching between phone and email also clears contact input and feedback.

An explicit international phone prefix takes precedence over the selected default country. After successful validation, the selector reflects the supported country identified by the number.

The country list contains Nigeria, Ghana, South Africa and 25 selected countries, including all G7 countries. It is a coverage list, not a population or economic ranking.

### Verification preview boundaries

The development build accepts only the local demo code `123456` and opens a guarded Home preview. Its timed loader and green tick demonstrate interface states; they do not prove delivery, identity or a server response.

- No SMS or email is sent.
- No code is checked against Supabase.
- Incorrect local demo codes show an error. Expiry and genuine server authentication responses are not connected.
- No session is created and no member is signed in.
- Resend, cooldown, rate-limit and recovery behaviour remain pending.
- Six digits currently follows the design reference; confirm it against the configured Auth provider before integration.

Valid contact input demonstrates loading, a demo-success tick and navigation to OTP entry. The correct demo code demonstrates loading and a tick before Home. These timed demonstrations run only in development and must be replaced during backend integration.

#### Required server-confirmed loading and success behaviour

- Before requesting a phone/email OTP, show the shared TPC loader. Do not show the green **code sent** tick or advance as though sending succeeded until the backend/provider confirms successful sending to the selected contact. A client-side format check, timer, or accepted request alone is not proof of delivery. If the provider distinguishes acceptance, sending and delivery, the backend contract and UI must preserve those distinctions.
- After a member enters the OTP, show the loader while server verification is pending. Show the verification-success tick and open authenticated member pages only after the server confirms the correct code and the authenticated session is established. A six-digit value or the local demo code is not production verification.
- Failed or expired codes and failed sending must show errors without a success tick. Offline queued attendance and pending department approval must remain pending until their respective server confirmations arrive.
- Reuse the TPC loader for attendance QR validation and other actual waiting states. A loading indicator never grants access or proves payment success. Respect Reduce Motion and stop animations when the operation ends.

Registration captures first name, surname and required age of at least four. Ordinary registration and authentication do not need usher/admin approval. Registration drafts populate the local Profile preview; returning sign-in previews initially show neutral details until the user explicitly loads the device demo profile or the future backend retrieves an authenticated profile. Profile details, native photo references and department demo outcomes can be explicitly saved on the device. Returning sign-in users must choose “Load saved device demo profile”; the app does not associate that profile with the entered phone/email. Department membership requires admin approval; head-of-department approval remains a proposal.

Contact details are kept in screen-local state and are not passed through route URLs.

### Branding

The active application uses a light cream/gold palette from `constants/theme.ts`.

Both supplied logo variants are stored as PNG files. Their original white and black backgrounds are preserved. Automatic dark-mode styling is not implemented.

The branded opening screen runs inside the application. Native launch-screen branding, application icons and store artwork require separate configuration and verification.

### Folder responsibilities

| Folder            | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| app               | Implemented routes and navigation layouts       |
| planned-routes    | Inactive placeholders awaiting implementation   |
| components/ui     | General reusable controls                       |
| components/shared | Reusable TPC-specific interface components      |
| constants         | Theme values and country choices                |
| utils             | Phone formatting and validation helpers         |
| hooks             | Reusable React behaviour when needed            |
| services          | Device demo persistence and app photo handling  |
| store             | Onboarding, attendance and saved demo workspace |
| assets            | Bundled images and future fonts/icons           |

Keep unfinished placeholders outside `app`; Expo Router discovers files inside that directory as routes.

Route groups such as `(auth)` organize navigation without adding that group name to the public URL. Route groups do not enforce authorization.

The planned routes do not yet cover every confirmed release feature. Complete the screen inventory before treating the route structure as final.

## Staff dashboard and shared packages

The staff dashboard is planned around Next.js App Router. Its page and layout files remain placeholders; it has no initialized application package or runnable workflow.

The shared directories reserve future responsibilities:

- `packages/types`: agreed API and database types.
- `packages/config`: suitable shared development configuration.
- `packages/ui`: an explicitly designed UI-sharing strategy.

These directories are not installable packages yet. Mobile and browser components should remain separate unless deliberately implemented for both platforms.

## Version 1 scope

Confirmed first-release scope includes attendance, giving, profiles, notifications, staff dashboard, badges, sponsor invitations, worker-roster approvals, sermons and weekly church messages.

These are requirements, not claims of completed implementation.

### Authentication and access

- Support phone OTP and an email OTP alternative.
- Grant ordinary member access immediately after successful contact verification.
- Do not require usher/admin approval before ordinary application use.
- Keep staff privileges and feature-specific approvals separate.

### Attendance

- Generate a new QR pass for each service.
- Open check-in 30 minutes before the service starts.
- Close check-in 30 minutes after the service ends.
- Queue offline attendance and preserve scan-time evidence.
- Request permission before capturing location evidence.
- Upload queued offline attendance within 24 hours after the service ends.
- Allow members who decline location permission to seek witness confirmation or choose not to pursue attendance.
- Allow an eligible verified member with confirmed attendance at the same service to confirm another member's presence.
- Do not require usher/admin approval for eligible-member witness confirmation.

GPS radius, accuracy thresholds, clock trust, evidence retention, witness limits and related edge cases still require decisions.

#### Attendance/check-in frontend demo

Home and Attendance share one sample service schedule. The scanner recognises only the public demo pass and never follows scanned URLs. Camera permission and foreground location consent are explicit. Location refusal leaves a witness route or the choice to leave without attendance.

Native attendance evidence and history persist in encrypted SecureStore chunks. The queue retains the scan timestamp, service snapshot and upload deadline. Web saves sample history but strips GPS coordinates; unuploaded GPS evidence needs a witness after web reload. No automatic upload or connectivity detection is claimed: sync and error buttons deliberately simulate server outcomes. The 24-hour deadline also applies to witnesses and retries.

Witness screens allow only an eligible sample member who is verified and confirmed at the same service; no admin approval is required. Confirmed, rejected, expired and sync-error screens are demo outcomes. Production still needs signed service-specific QR passes, trusted server time, evidence assessment, eligibility/ownership checks, actual sync and durable server histories.

Failed saved-data loading blocks new writes until retry succeeds or the member explicitly resets demo data. Reset uses a separate recovery path, including corrupted native metadata. The queue holds up to 30 records. “Start another sample service” creates a new service without deleting history. Settings can clear saved demo data. Pure rule tests cover time boundaries and transitions; the latest batch still needs the manual test/device checks in the handoff.

### Giving and staff operations

- Use Paystack for giving.
- Provide giving history, receipts and attendance history.
- Support authorized staff service management, reporting, financial operations and settings.
- Implement and test a complete permission matrix for Member, Usher, Finance Officer, Pastor and Super Admin.

Current monetary limits in code are implementation constraints. They do not establish newly approved configurable product policy.

## Database foundation

| Table          | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| profiles       | Auth-linked identity, role and legacy verification state |
| members        | Church-specific membership information                   |
| services       | Church service records                                   |
| attendance     | Service attendance records                               |
| funds          | Giving categories                                        |
| offerings      | Gift intent, ownership, amount and status                |
| payments       | Provider payment records                                 |
| notifications  | Member notifications and read state                      |
| audit_logs     | Sensitive-operation audit records                        |
| webhook_events | Recorded payment events and duplicate handling           |

Seed data includes Tithe, Offering, Building and Missions.

The hardening migration adds restricted writes and payment integrity controls. Both migrations must be considered together when reviewing current behaviour.

### Current access controls

- Ordinary profile updates cannot change roles, verification or phone numbers.
- Ordinary notification updates are restricted to read state.
- Staff-role checks require verified profiles.
- Checked database operations handle membership-verification and role changes.
- Sensitive membership changes generate audit records.
- Direct client financial and attendance writes are blocked.

Current profile provisioning requires a phone number and full name in Auth registration. Missing data requires a later profile-completion workflow.

Revoking membership verification does not implement account deactivation.

### Authentication mismatch requiring backend work

The current backend uses staff-managed `profiles.is_verified` checks and phone-based profile provisioning.

That differs from the confirmed requirement for immediate ordinary-member access after phone or email verification.

Resolve the mismatch through reviewed backend changes and tests before integration. Preserve staff authorization controls. The frontend must not assign roles or set protected verification flags.

## Payment implementation

Existing payment code provides:

- Authenticated payment initialization subject to the current legacy verification gate.
- Input validation for amounts, funds, references and checkout email.
- Server-assigned ownership, references, currency and pending status.
- Ownership checks before member payment verification.
- Provider reference, amount, currency and transaction matching.
- HMAC SHA-512 verification of original webhook bodies.
- Atomic settlement with uniqueness constraints and replay handling.
- Database-result checks and safe error responses.

Phone-only members can supply a genuine checkout email without changing their authentication method.

Successful settlement records the offering, payment and related audit/event data in one transaction. Repeated successful settlement does not create duplicate payment records.

Initialization does not provide a client retry-idempotency contract. An uncertain provider outcome may leave an offering pending.

Reconciliation, refunds, recovery and financial retention/anonymization remain unfinished. Restrictive foreign keys prevent accidental cascading deletion of financial records.

### Giving and payment-history frontend

Giving offers Offering, Tithes, Property giving, From the heart and a sample outreach campaign. Funds are fixtures, not administrator-managed data. Amounts use integer kobo. The receipt-email field validates the design but does not send mail or persist that contact.

A reviewed gift creates an owned `DEMO-` checkout reference on this device. Checkout previews pending, ongoing, processing, queued, successful, failed, abandoned/cancelled and reversed outcomes. The return screen requires an explicit demo action; navigation parameters alone do not change payment state. Unknown references cannot create records. Terminal failures require a new checkout; replay cannot undo success, and a reversal removes receipt eligibility.

Payment History is separate from Giving. It filters saved demo checkouts or opt-in sample illustrations by category and status. A demo receipt is available only for a successful saved demo checkout and states that it is not payment proof. The workspace holds up to 50 payment demos and 30 invitations.

No Paystack checkout, live callback, payment verification, real history or financial receipt is connected. Those remain backend integration work. Proposed fund/campaign data requirements appear in the API contract; they do not claim an available endpoint.

## Local mobile development

### Prerequisites

- Node.js and npm.
- VS Code or another suitable editor.
- Mobile dependencies installed from the mobile package.
- Expo Go on the test iPhone.
- The same Expo account and a reachable trusted Wi-Fi network on laptop and phone.

The root and mobile packages maintain independent lockfiles. Run mobile commands inside `apps/mobile`.

### Install dependencies

For a checkout with a matching mobile lockfile:

```powershell
# ===============================================================
# INSTALL THE LOCKED MOBILE DEPENDENCIES
# npm ci replaces node_modules using the recorded lockfile.
# ===============================================================

Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'

& 'C:\Program Files\nodejs\npm.cmd' ci

if ($LASTEXITCODE -ne 0) {
    throw 'Dependency installation failed. Inspect the npm output.'
}
```

`npm ci` requires a matching package manifest and lockfile. It does not update the dependency declarations.

The root Supabase tooling has a separate installation; it is not needed merely to preview the mobile screens.

### Start the preview

```powershell
# ===============================================================
# START THE MOBILE PREVIEW
# Keep the terminal running while testing on the iPhone.
# ===============================================================

Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'

& 'C:\Program Files\nodejs\npm.cmd' run start
```

Scan the terminal QR code with the iPhone camera and open Expo Go. Allow local-network access if prompted. Ctrl+C stops the server.

If saved changes are not appearing, stop Expo and restart with:

```powershell
# ===============================================================
# REBUILD THE DEVELOPMENT BUNDLE
# Clear Metro's bundle cache without deleting source files.
# ===============================================================

& 'C:\Program Files\nodejs\npm.cmd' run start -- --clear
```

The separator `--` passes `--clear` to Expo.

### Check TypeScript

Run in a second terminal:

```powershell
# ===============================================================
# CHECK MOBILE TYPESCRIPT
# Validate types without generating compiled JavaScript.
# ===============================================================

Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'

& 'C:\Program Files\nodejs\npm.cmd' run typecheck

if ($LASTEXITCODE -ne 0) {
    throw 'Type checking failed. Inspect the reported errors.'
}
```

Expo generates route types during development startup. Restart it after adding routes if those generated types are stale.

`npm.cmd` is the Windows npm launcher. `&` is PowerShell's call operator. `$LASTEXITCODE` contains the last native program's exit status; zero normally indicates success.

### Available scripts

| Script          | Purpose                                          |
| --------------- | ------------------------------------------------ |
| start           | Start Expo development server                    |
| android         | Start Expo and request an Android preview        |
| web             | Start Expo and request a browser preview         |
| typecheck       | Run TypeScript with no compiled output           |
| test            | Run all pure member-model/navigation tests       |
| test:attendance | Run the original attendance rule tests           |
| format          | Format source, services, tests and documentation |
| format:check    | Verify formatting without changing files         |

Formatting and formatting checks are configured through pinned Prettier.
Linting, automated frontend interaction tests and CI remain unconfigured.

## Environment and secrets

The payment functions read:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `APP_URL`

Some Supabase values are supplied by the function runtime. Verify target-project configuration before setting them manually.

Service-role credentials and Paystack secret keys belong on the server. Do not place them in mobile/browser bundles or commit real credentials.

The current mobile preview needs no Supabase or Paystack credentials. Safe environment examples, payment callbacks and mobile return-flow configuration remain pending.

Do not log phone numbers, email addresses, OTP values, access tokens or secret keys while implementing authentication.

## Verification record

**Current batch:** the user reported passing Prettier format:check, TypeScript and the original 23 tests before the final functional fixes. The current source adds 18 recovery/lifecycle cases (41 total) and stronger name-limit assertions. The attached post-fix output confirms Prettier write/check, TypeScript and all 41 tests passed (0 failed/skipped). After the expo-asset peer was installed, Expo alignment and Doctor 20/20 passed; both iOS/web exports completed. The current audit reports eight findings (five low, three high) from Zod/deepmerge and remains unresolved. The user confirmed both iPhone and browser acceptance passed on 31 October 2026; these are manually reported results. The assistant has used library-based source formatting/syntax checks and has run no terminal commands. See [member demo handoff](docs/MEMBER-UI-HANDOFF.md) and [acceptance cases](docs/MEMBER-UI-TEST-PLAN.md). Earlier results below apply to earlier snapshots.

### Historical foundation verification baseline

Verification completed on 29 October 2026:

| Check                                                                              | Evidence and result                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Formatting                                                                         | User-supplied terminal output confirms `npm run format` completed         |
| Formatting verification                                                            | `npm run format:check` reported that all matched files use Prettier style |
| TypeScript                                                                         | `npm run typecheck` completed without errors                              |
| Current iOS export                                                                 | Expo successfully exported a Hermes bundle and assets to `dist`           |
| Branded opening and cream/gold palette                                             | User-reported iPhone testing and supplied screenshots                     |
| Country wheel, phone/email entry and phone formatting                              | User-reported iPhone testing                                              |
| Enter controls and navigation                                                      | User-reported iPhone testing                                              |
| OTP preview, empty/short-code feedback, paste/edit behaviour and keyboard controls | User reported that the final device regression checks passed              |
| Git whitespace                                                                     | Passed against tracked changes before final README closeout               |

The iOS export contained a 2.8 MB Hermes bundle and the light church-logo asset.
It is a local bundle export, not a signed application or deployment.

Device checks are manually reported results, not automated interaction tests.
The current verification screen checks the development-only demo code. No real OTP
request, server verification or authenticated session has been implemented.
The newer Giving and Payment History pages require their own formatting,
TypeScript and device checks; the historical results above do not verify them.

Known dependency security findings remain unresolved. Formatting, TypeScript,
bundling and device checks do not establish production readiness.

### Historical backend checks

Earlier project documentation records:

- 72 payment/helper checks using mocked external services.
- An isolated PostgreSQL migration, seed and regression run.
- A limited TypeScript semantic check using review-provided declarations.

These checks were not rerun during the current frontend milestone. The complete temporary 72-case runner is not part of the repository or CI.

Payment helper tests and SQL regression checks are present in the repository. Full Deno/remote-SDK checks, hosted Supabase behaviour, real Paystack integration and parallel-session settlement remain unverified.

## Deployment dependency

Payment handlers depend on:

`supabase/migrations/20261022090000_harden_access_and_payments.sql`

Apply the initial schema and hardening migration in order through a reviewed deployment procedure. Existing deployed state must be inspected first.

The webhook's gateway JWT exception is specific to provider-signed webhook handling. Member payment endpoints still require authenticated callers.

Deployment, hosted migrations, real payments and recovery have not been verified by this frontend milestone.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for preparation requirements. It is not a rehearsed production deployment runbook.

## Progress checklist

This is the project's single progress checklist.

Checked items indicate source implementation, repository preparation or explicitly described verification. They do not imply production deployment or release approval.

### Repository preparation

- [x] Reserve mobile, admin and shared-package directories.
- [x] Record Supabase CLI tooling and the root lockfile.
- [x] Establish the original mobile/admin route scaffold.
- [x] Park unfinished mobile routes outside active navigation.
- [x] Add file-purpose banners and section comments.
- [x] Document project responsibilities and folder boundaries.
- [x] Preserve dependencies and generated caches through ignore rules.

### Mobile foundation

- [x] Initialize the mobile package and lockfile.
- [x] Configure Expo, TypeScript and typed routes.
- [x] Store light and dark church-logo assets.
- [x] Implement the branded opening screen and shared light palette.
- [x] Implement phone/email entry and method switching.
- [x] Implement the approved 28-country selector.
- [x] Implement national/international phone formatting and validation.
- [x] Add Enter controls and local feedback.
- [x] Implement the six-digit verification-code preview.
- [x] Connect opening, login and verification navigation.
- [x] Add iPhone keyboard-dismiss controls.
- [x] Pass the foundation TypeScript check (historical snapshot; repeat for this batch).
- [x] Receive user confirmation of the branded interface and country-selection experience.
- [ ] Complete the final device regression cases in the verification record.
- [ ] Run the current full iOS export.
- [ ] Format and review the complete branch diff, including untracked files.
- [ ] Complete branch commit, pull-request review and merge.

### Existing backend foundation

- [x] Define the initial ten-table schema and baseline RLS.
- [x] Seed four giving funds.
- [x] Add the access/payment hardening migration.
- [x] Restrict protected profile and notification updates.
- [x] Harden verified staff-role checks.
- [x] Add audited membership-verification and role operations.
- [x] Provision profiles when required registration data exists.
- [x] Block unsafe direct financial and attendance writes.
- [x] Validate payment inputs and checkout email.
- [x] Generate references and check payment ownership.
- [x] Match provider transaction details before settlement.
- [x] Implement atomic settlement, uniqueness and replay handling.
- [x] Verify webhook signatures and configure the gateway exception.
- [x] Check persistence results before acknowledging settlement.
- [x] Add helper tests and SQL regression checks.
- [x] Restrict accidental financial-record cascading deletion.

### Authentication and remaining backend work

- [ ] Configure phone and email OTP providers, limits and recovery.
- [ ] Confirm OTP length and expiry against provider configuration.
- [ ] Connect OTP sending, verification, resend and genuine error states.
- [ ] Implement secure session persistence, refresh and logout.
- [ ] Align profile provisioning and verification gates with immediate ordinary-member access.
- [ ] Complete profile onboarding when registration data is missing.
- [ ] Implement account deactivation and enforcement.
- [ ] Complete and test the role-permission matrix.
- [ ] Implement service management and timezone handling.
- [ ] Implement service QR generation and validity-window enforcement.
- [ ] Implement trusted check-in and eligible-member witness confirmation.
- [ ] Implement offline evidence, queuing, synchronization and duplicate handling.
- [ ] Implement payment initialization retry/recovery design.
- [ ] Implement payment reconciliation and authorized refunds.
- [ ] Agree financial retention, anonymization and deletion rules.

### Member demo source and remaining frontend work

The checks in this subsection indicate source written, not tests passed.

- [x] Correct shared service times, gold-card contrast, required-age wording, async photo/location lifecycle guards and menu routing.
- [x] Build editable Profile, explicit saved device profile/photo controls and department pending/approved/rejected demos.
- [x] Build Settings and saved notification preferences.
- [x] Build announcement list/details, weekly messages and read/unread notification views.
- [x] Build sample sermons, real controls over bundled test audio and session bookmarks.
- [x] Build demo badges, newcomer invitations and financial-sponsorship request forms.
- [x] Build sample worker availability responses and department schedules behind demo approval.
- [x] Build attendance history, confirmed/rejected views, eligible-witness request/confirmation and persistent native queue/error/retry states.
- [x] Build demo checkout, explicit return processing, all documented provider statuses, saved demo history and receipt eligibility.
- [x] Add regression test source for payment ownership/replay, profile rules, witness eligibility, queue transitions and menu destinations.
- [x] Correct name-limit consistency, blocked writes after loading failure, corrupt-storage recovery, schedule shortcut focus and async playback cancellation.
- [x] Add recovery/lifecycle regression source, bringing the Node suite to 41 cases; execution of the final snapshot remains pending.
- [x] Standardize frontend filename/purpose banners and meaningful section comments; clarify inactive parked routes.
- [x] Install the new Expo modules and update the mobile lockfile (manifest/installed-module presence checked).
- [ ] Run Prettier write/check, TypeScript, all 41 regression tests, Expo compatibility/doctor and iOS/web exports after the final fixes.
- [x] Receive user confirmation that final iPhone and browser acceptance passed (31 October 2026; manually reported).
- [ ] Review the full branch diff, commit/push manually and obtain partner review into `dev`.
- [ ] Integrate real authentication, accounts, approvals, content, signed QRs, sync, payment checkout and receipts with agreed backend contracts.
- [ ] Initialize and implement the separate staff dashboard, reports, member/service/fund administration and staff permission flows.
- [ ] Verify production accessibility, performance, device permissions, native launch artwork and distribution; automatic dark mode remains unimplemented.

### Documentation, testing and release

- [x] Distinguish current backend controls from confirmed requirements in database notes.
- [x] Document implemented payment responses and missing integration contracts.
- [x] Replace the truncated deployment draft with a preparation guide.
- [ ] Reconcile remaining source-document conflicts and open policy parameters.
- [ ] Keep API contracts synchronized with each implemented integration.
- [ ] Review remaining ignore rules.
- [ ] Add safe environment examples and runtime requirements.
- [ ] Configure appropriate formatting, linting and automated test commands.
- [ ] Make backend handler regression checks reproducible from the repository.
- [ ] Run complete Deno and remote-SDK type checks.
- [ ] Test migrations and permitted/forbidden actions in isolated Supabase.
- [ ] Test concurrent settlement and failure recovery.
- [ ] Complete Supabase/Paystack test-mode integration checks.
- [ ] Test QR expiry, offline synchronization and timezone boundaries.
- [ ] Measure relevant performance and notification requirements.
- [ ] Configure CI and verify required-review/branch-protection settings.
- [ ] Rehearse backups, restoration and reconciliation.
- [ ] Rehearse deployment and rollback.
- [ ] Complete explicitly authorized live-payment checks before release.
- [ ] Obtain leadership user-acceptance and release approval.
- [ ] Complete operational handover documentation.

### Open dependency security findings

Current evidence: user-run npm audit on 30 October 2026 reports eight affected-package findings (five low, three high). These propagate from two underlying advisories through the dependency tree. Expo compatibility, Doctor 20/20 and successful iOS/web exports do not resolve them.

- [ ] SEC-02: Assess/remediate Zod memory exhaustion (GHSA-mrhx-c7xc-m3w5). Current path: Expo CLI → zod@3.25.76. The advisory lists 4.6.6 as patched, but the installed CLI requires ^3.25.76; a forced major override is not validated. Identify an Expo-compatible fix and assess input reachability.
- [ ] SEC-03: Assess/remediate deepmerge prototype poisoning (GHSA-gcqx-w48m-w2h4). Current path: @expo/config → deepmerge@4.3.1. The advisory currently lists no patched version. Assess untrusted configuration inputs and reviewed remediation options.

Historical SEC-01 URL-decoder advisories from SDK 57 no longer appear in this supplied SDK 58 audit; they are not part of the current eight findings.

The proposed forced audit fix would install Expo 51.0.39, downgrading the SDK 58 project. Preview ordinary compatible fixes with audit fix --dry-run; do not treat a forced framework downgrade or untested Zod major override as remediation.

Current evidence identifies Expo tooling dependency paths, not verified production exploitability or confirmed absence from shipped bundles. Keep demo development on trusted local infrastructure with synthetic data. Before release, require validated fixes or a documented exposure assessment and explicit acceptance of remaining risk. These findings remain open for partner review.

## Commenting conventions

Handwritten source uses:

1. A filename/path and purpose banner.
2. Named section dividers.
3. Comments explaining decisions and constraints.

| File type                        | Comment syntax                   |
| -------------------------------- | -------------------------------- |
| TypeScript / TSX                 | `//` or appropriate JSX comments |
| SQL                              | `--`                             |
| TOML / ignore files / PowerShell | `#`                              |
| Strict JSON                      | Comments are not supported       |

Preserve useful generated configuration comments. Do not manually comment lockfiles, generated files, Git internals or empty placeholders.

## Contribution workflow

Current milestone history: [MEMBER-UI-CHANGELOG.md](docs/MEMBER-UI-CHANGELOG.md). Copy-ready PR title/body: [PR-MEMBER-UI.md](docs/PR-MEMBER-UI.md). Replace its pending validation entries with actual results before submitting.

The current member UI work is on `chore/member-home-ui`. The foundation milestone was already merged into `dev`.

1. Inspect branch status and preserve outstanding work.
2. Complete milestone checks and documentation.
3. Format and review the complete change set.
4. Stage only intended files and inspect the staged diff.
5. Create a focused local commit.
6. Push the branch when authorized.
7. Open a pull request with the verified target branch.
8. Include the problem, changes, checks, manual results and remaining limitations.
9. Obtain the development partner's review.
10. Merge through the agreed repository process.
11. Update the destination branch before starting the next work branch.

The confirmed integration branch is `dev`; this repository workflow does not use `main`. Open this milestone’s pull request against `dev` and wait for the development partner’s review before merging or starting another branch.

Remain on the current work branch until its agreed review and merge are complete.

CODEOWNERS identifies review owners. It does not by itself enforce approval from every listed owner. Verify repository rules separately.

A local commit precedes a pull request. A merged pull request does not establish deployment or production readiness.

## Future scope and exclusions

Groups, general events, prayer requests, multiple branches, scripture content, pledges and advanced attendance analytics appear in older future-scope material. Their inclusion is not confirmed here.

Email OTP and sermons belong to the confirmed first-release scope.

Live streaming, chat/social features, full accounting/payroll, inventory and replacement of the public website are outside the stated scope.

## References

- [API contract and integration gaps](docs/API-CONTRACT.md)
- [Database implementation notes](docs/DATABASE.md)
- [Deployment preparation guide](docs/DEPLOYMENT.md)
- [Supabase documentation](https://supabase.com/docs)
- [Member UI handoff and manual commands](docs/MEMBER-UI-HANDOFF.md)
- [Member UI acceptance cases](docs/MEMBER-UI-TEST-PLAN.md)
- [Expo documentation](https://docs.expo.dev)
- [React Native documentation](https://reactnative.dev)
- [Next.js documentation](https://nextjs.org/docs)

Licensing and distribution permissions remain with the organization.
