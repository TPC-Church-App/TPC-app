# TPC Church App

Attendance and digital giving for The Pentecostal Congregation.

TPC Church App is being developed as a mobile application for members and a
web dashboard for authorized church staff. Members will check in to services,
give through Paystack, and view their attendance and giving history.

**Stage:** Backend scaffold with access-control and payment hardening.  
**Frontend:** Commented file structure; screen implementation pending.  
**Release status:** Development only.

## Project responsibilities

The supplied Product Requirements Document lists:

| Contributor | Responsibility |
|---|---|
| John | Backend / DevOps Lead |
| Josiah | Frontend / UI/UX Lead |

Its filename refers to v2.1, while its internal title/footer identifies
Version 2.0 and Draft for Approval. The authoritative version and approval
status still need confirmation.

## Architecture

| Area | Technology | Current state |
|---|---|---|
| Member application | React Native, Expo and Expo Router | Commented screen/layout placeholders |
| Staff dashboard | Next.js App Router | Commented page/layout placeholders |
| Database | Supabase PostgreSQL | Initial schema, seed and hardening migration |
| Authentication | Supabase Auth with phone/SMS OTP | Configuration and application integration pending |
| Custom backend | TypeScript on Supabase Edge Functions | Payment functions prepared for further integration testing |
| Payments | Paystack | Initialization, verification and webhook code |
| Live updates | Supabase Realtime | Application integration pending |
| Shared packages | Types, configuration and selected UI resources | Reserved directories |

The backend uses Supabase Edge Functions and Deno APIs. Node.js/npm currently
provide development tooling rather than an Express application server.

Application manifests, framework configuration, npm workspaces and a Turbo
pipeline have not been configured.

## Repository structure

The `.tsx` files below contain comments only. Their presence does not mean
that the associated screens or layouts work.

```text
tpc-app/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   ├── otp.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── home.tsx
│   │   │   │   ├── give.tsx
│   │   │   │   ├── history.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── check-in/
│   │   │   │   ├── scanner.tsx
│   │   │   │   ├── success.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── give/
│   │   │   │   ├── amount.tsx
│   │   │   │   ├── fund.tsx
│   │   │   │   ├── checkout.tsx
│   │   │   │   ├── processing.tsx
│   │   │   │   ├── success.tsx
│   │   │   │   ├── failed.tsx
│   │   │   │   └── receipt.tsx
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── constants/
│   │   └── assets/
│   └── admin/
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── members/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── services/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── create/page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── attendance/page.tsx
│       │   │   ├── offerings/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   ├── settings/page.tsx
│       │   │   └── layout.tsx
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/
│       │   └── shared/
│       ├── lib/
│       └── public/
├── packages/
│   ├── ui/
│   ├── types/
│   └── config/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts
│   │   │   ├── payments.ts
│   │   │   └── payments.test.ts
│   │   ├── offerings-initialize/index.ts
│   │   ├── offerings-verify/index.ts
│   │   └── paystack-webhook/index.ts
│   ├── migrations/
│   │   ├── 20261021194959_initial_schema.sql
│   │   └── 20261022090000_harden_access_and_payments.sql
│   ├── tests/
│   │   └── access_and_payment_regression.sql
│   ├── config.toml
│   └── seed.sql
├── docs/
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── .github/workflows/
├── .gitignore
├── package.json
└── package-lock.json
```

`.gitkeep` files preserve directories that have no implementation files yet.

## Frontend organization

### Mobile application

- `app` contains planned routes and navigation layouts.
- `components/ui` holds reusable interface elements.
- `components/shared` holds feature-oriented reusable components.
- `hooks` holds reusable React behavior.
- `services` holds application API/client integration.
- `store` reserves a location for shared application state.
- `constants` holds appropriate shared values.
- `assets` holds images and other bundled resources.

The root `index.tsx` represents the initial route or redirect. Native splash
behavior needs separate Expo configuration.

The tabs layout will define the main tab navigator. Route-group names such as
`(auth)` and `(tabs)` organize navigation without appearing in the route URL.

`(tabs)/give.tsx` represents `/give`; `give/amount.tsx` represents `/give/amount`.
Avoid adding a second `/give` entry unintentionally through `give/index.tsx`.

### Admin dashboard

Next.js pages use `page.tsx`. Layout files provide the shared page shell and
navigation.

Route-group folders organize files. They do not enforce access permissions by
themselves. Authorization must also be implemented and tested.

### Shared packages

- `packages/types` reserves agreed database and API types.
- `packages/config` reserves suitable shared development configuration.
- `packages/ui` reserves an explicit UI-sharing strategy.

Mobile and browser components remain separate unless their implementation
deliberately supports both platforms.

The current scaffold contains 21 mobile and 14 admin `.tsx` placeholders,
including layouts. These are not 35 implemented screens. The PRD's complete
screen inventory still needs mapping to the final routes.

## Database foundation

The initial schema defines:

| Table | Purpose |
|---|---|
| `profiles` | Application profiles, roles and verification |
| `members` | Church-specific membership information |
| `services` | Church service records |
| `attendance` | Service check-in records |
| `funds` | Giving categories |
| `offerings` | Intended member gifts |
| `payments` | Provider transaction records |
| `notifications` | Member notification records |
| `audit_logs` | Sensitive operational events |
| `webhook_events` | Processed payment events |

Seed data provides Tithe, Offering, Building and Missions.

A forward migration contains the functional access and payment repairs.
Executable statements in the original migration and seed were preserved;
their comments were improved.

### Access controls implemented

- Ordinary profile updates cannot change roles, verification or phone numbers.
- Ordinary notification updates are restricted to their read state.
- Staff permission checks require verified profiles.
- Restricted database operations handle role and membership-verification changes.
- Sensitive membership changes generate audit records.
- Direct client financial and attendance writes are blocked.

Profile provisioning occurs when Auth registration contains a real phone
number and full name. A complete profile-completion workflow remains necessary
when those fields are missing.

Revoking membership verification does not implement account deactivation.
That separate workflow remains unfinished.

## Payment handling

The current functions provide:

- Authenticated, verified-member payment initialization.
- Method, JSON, amount, precision, fund, reference and email validation.
- Server-created pending offerings and unique payment references.
- Ownership checks before member payment verification.
- Matching of provider reference, amount, currency and transaction identity.
- HMAC signature verification over the original Paystack webhook body.
- Atomic settlement with uniqueness constraints and replay protection.
- Database-result checks and safe error responses.

Phone-only members can provide a genuine checkout email without changing their
authentication method.

Offering/payment settlement and the associated audit/event records are written
in one database transaction. Repeated confirmation does not create another
payment for the same offering.

Uncertain provider outcomes may remain pending. Scheduled reconciliation,
refund handling and complete operational recovery remain unfinished.

Restrictive financial foreign keys prevent accidental cascading deletion.
An explicit retention and anonymization policy still needs agreement.

## Version 1 scope

Members will be able to:

- Register and sign in through phone/SMS OTP.
- Complete membership verification.
- Check in using valid service QR codes.
- Give through Paystack.
- View attendance and giving history.
- Access receipts and notification preferences.

Staff workflows include permitted membership verification, manual attendance,
service management, reports, refunds and role/settings administration.

The intended roles are Member, Usher, Finance Officer, Pastor and Super Admin.
Their complete permission matrix requires implementation and testing at the
interface, backend and database levels.

## Development status

No new packages are required for this structure-only contribution.

The root package currently records the Supabase CLI dependency. Expo, Next.js
and the application's frontend dependencies have not been installed or
configured through this scaffold.

Application `package.json` files, Expo configuration, workspace registration
and any Turbo pipeline belong to the later runnable-application setup.

There are currently no application `dev`, `build`, `lint` or unified `test`
scripts. Do not interpret commented files as runnable routes.

## Environment and secrets

The backend functions read:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `APP_URL`

Some Supabase values are supplied by the function runtime.

Service-role credentials and Paystack secret keys belong on the server.
Do not commit real credentials or include them in mobile/browser bundles.

Safe environment examples and payment callback/deep-link setup remain pending.

## Verification record

The repository contains payment helper tests and SQL access/payment regression
checks.

During the isolated backend review:

- 72 payment/helper checks passed using mocked external services.
- An isolated PostgreSQL migration, seed and regression run passed.
- A limited TypeScript semantic check passed using review-provided declarations.

The complete 72-case review runner was temporary and is not part of the
repository or CI.

Full Deno/remote-SDK checks, hosted Supabase integration, real Paystack
integration and parallel-session settlement remain unverified.

The frontend placeholders have no functional behavior to validate yet.

## Deployment dependency

Apply `20261022090000_harden_access_and_payments.sql` before deploying the updated
payment functions. Those functions rely on its database changes.

The Paystack webhook uses provider signature verification instead of gateway
JWT verification. Member-facing payment functions still require authenticated
callers.

No hosted migration, function deployment or live payment check was performed
during the isolated review.

## Progress checklist

Checked items describe completed repository preparation or backend code.
They do not imply deployment or full end-to-end verification.

### Repository preparation

- [x] Reserve mobile, admin and shared-package directories.
- [x] Record the existing Supabase CLI dependency and root lockfile.
- [x] Prepare 21 mobile screen/layout placeholders.
- [x] Prepare 14 admin page/layout placeholders.
- [x] Add file-purpose banners and section comments to the placeholders.
- [x] Apply the agreed comments to current backend TypeScript and SQL files.
- [x] Document team responsibilities and the frontend structure.
- [x] Correct the malformed temporary-file ignore pattern.

### Backend foundation and repairs

- [x] Define the initial ten-table schema, role/status types and RLS baseline.
- [x] Seed four giving funds.
- [x] Add a forward access/payment hardening migration.
- [x] Restrict protected profile and notification updates.
- [x] Harden verified staff-role checks.
- [x] Add audited membership-verification and role-management operations.
- [x] Provision profiles when required registration data exists.
- [x] Block unsafe direct financial and attendance writes.
- [x] Validate payment input and require a genuine checkout email.
- [x] Generate provider-compatible references.
- [x] Check payment ownership and provider transaction details.
- [x] Add atomic settlement, uniqueness constraints and replay handling.
- [x] Verify webhook signatures and configure its gateway exception.
- [x] Check database results before acknowledging settlement.
- [x] Add payment helper tests and SQL regression checks.
- [x] Prevent accidental cascading deletion of financial records.

### Remaining backend implementation

- [ ] Complete profile onboarding when registration data is missing.
- [ ] Implement account deactivation and enforcement.
- [ ] Configure phone/SMS OTP, limits and recovery.
- [ ] Complete and test the full role-permission matrix.
- [ ] Implement service management and explicit timezone handling.
- [ ] Implement QR generation, download and validity-window enforcement.
- [ ] Implement trusted QR and authorized manual check-in.
- [ ] Implement offline queuing, synchronization and duplicate handling.
- [ ] Implement payment reconciliation and recovery.
- [ ] Implement authorized refunds and refund reconciliation.
- [ ] Agree financial retention and anonymization rules.

### Frontend implementation

- [ ] Initialize the mobile and admin application packages.
- [ ] Add valid framework configuration and agreed workspace setup.
- [ ] Decide whether a Turbo pipeline is needed.
- [ ] Map every required PRD screen to its route and acceptance criteria.
- [ ] Implement authentication, session persistence, refresh and logout.
- [ ] Implement membership verification and member management.
- [ ] Implement service, QR scanning and manual attendance interfaces.
- [ ] Implement attendance history and live views.
- [ ] Implement checkout, callbacks/deep links and payment states.
- [ ] Implement receipts and giving history.
- [ ] Implement notifications, preferences and service reminders.
- [ ] Implement dashboards, reports and CSV/PDF exports.
- [ ] Implement authorized role, church and fund settings.
- [ ] Cover loading, empty, denied, error, success and offline states.
- [ ] Verify accessibility and supported devices.

### Documentation, testing and release

- [ ] Confirm the authoritative PRD version and approval.
- [ ] Update DATABASE.md to match the hardening migration.
- [ ] Replace the incomplete DEPLOYMENT.md draft with a verified procedure.
- [ ] Review the remaining ignore rules.
- [ ] Add safe environment examples and runtime/dependency documentation.
- [ ] Add format, type, lint and test commands for initialized applications.
- [ ] Make handler regression checks reproducible from the repository.
- [ ] Run complete Deno and remote-SDK type checks.
- [ ] Test migrations and permitted/forbidden actions in local Supabase.
- [ ] Test genuine concurrent settlement and failure recovery.
- [ ] Complete Supabase/Paystack test-mode integration checks.
- [ ] Test QR expiry, synchronization and timezone boundaries.
- [ ] Measure performance and notification requirements.
- [ ] Configure CI, required reviews and branch protection.
- [ ] Rehearse backups, restoration and reconciliation.
- [ ] Complete authorized live-payment checks before release.
- [ ] Obtain leadership user-acceptance approval.
- [ ] Complete operational handover documentation.

## Commenting conventions

Hand-written source uses:

1. A filename/path and purpose banner.
2. Named section dividers.
3. Comments explaining important decisions or constraints.

Comment syntax:

- TypeScript/TSX: `//`
- SQL: `--`
- TOML and ignore rules: `#`
- Strict JSON: no comments

Preserve useful generated configuration comments. Do not manually comment
lockfiles, generated files, Git internals or empty placeholders.

The existing generated Supabase configuration retains its original comments;
the added payment webhook section uses the agreed section style.

## Contribution workflow

The integration branch is currently `dev`.

1. Inspect the clone and outstanding changes.
2. Preserve uncommitted work before updating `dev`.
3. Create a descriptive work branch.
4. Make and review the intended changes.
5. Stage related files and inspect the staged diff.
6. Commit with accurate messages.
7. Push the work branch.
8. Open a pull request against `dev`.
9. Request review and follow the organization's merge process.

A committed requirement is not automatically an implemented feature.
A completed isolated test is not automatically a successful deployment.

## Later versions and exclusions

Later versions include email login, groups, events, sermons, prayer requests,
multiple branches, scripture content, pledges and advanced attendance analytics.

Live streaming, chat/social features, full accounting/payroll, inventory and
replacement of the public website are outside the stated scope.

## References

- [Database notes — pending update](docs/DATABASE.md)
- [Deployment notes — incomplete draft](docs/DEPLOYMENT.md)
- [Supabase documentation](https://supabase.com/docs)
- [Expo documentation](https://docs.expo.dev)
- [Next.js documentation](https://nextjs.org/docs)

Licensing and distribution permissions remain with the organization.
