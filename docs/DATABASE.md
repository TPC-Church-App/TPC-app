# TPC Church App - Database Implementation Notes

**Reviewed against repository migrations:** 29 October 2026.
**Hosted state:** Not inspected or migrated during the mobile foundation update.

## Sources and order

1. `supabase/migrations/20261021194959_initial_schema.sql` defines the initial schema.
2. `supabase/migrations/20261022090000_harden_access_and_payments.sql` restricts
   writes, adds integrity constraints and provides atomic payment settlement.
3. `supabase/migrations/20261103090000_email_profiles_and_giving_minimum.sql`
   provisions email-created member profiles and enforces the current giving
   minimum while preserving old payment amounts.
4. `supabase/seed.sql` contains local development fund data.

Read both migrations together. The later migration replaces some original
policies. Editing documentation does not change an existing database; future
schema changes must use forward migrations rather than rewriting applied history.

## Tables

| Table          | Responsibility                                                           |
| -------------- | ------------------------------------------------------------------------ |
| profiles       | Auth-linked identity, contact details, role and legacy verification flag |
| members        | Church-specific membership data                                          |
| services       | Service records                                                          |
| attendance     | Member/service attendance records                                        |
| funds          | Giving categories and availability                                       |
| offerings      | Gift intent, owner, amount, reference and status                         |
| payments       | Recorded provider payments                                               |
| notifications  | Member notifications and read state                                      |
| audit_logs     | Sensitive-operation audit records                                        |
| webhook_events | Recorded payment events used for duplicate handling                      |

Seed funds include Tithe, Offering, Building, Missions, Evangelist support and
Church outreach program. Seed data applies to local database setup; it does not
publish funds to a hosted project.

## Current access controls

Row Level Security (RLS) controls which records callers can access. SQL grants
also control which operations and columns they can change; both layers matter.

- Ordinary authenticated profile updates are limited to `full_name`, with
  row ownership enforced. Clients cannot assign roles, phone or verification.
- Ordinary notification updates are limited to `is_read`, subject to row policies.
- `has_role` checks the requested role and `is_verified = true`.
- Ushers have a profile lookup policy. Staff access elsewhere depends on the
  actual table policies, not a universal role-based permission grant.
- `set_member_verification` performs checked staff operations on other users;
  revocation and staff targets have additional restrictions.
- `set_member_role` requires Super Admin authority and rejects self-role changes.
- Direct authenticated/anonymous INSERT, UPDATE and DELETE are revoked on
  attendance, offerings, payments, webhook_events and audit_logs.

Ushers cannot directly insert attendance through the ordinary client. The
`attendance-check-in` Edge Function authenticates the member, checks the
service QR and server-side time window, then inserts with server-only
credentials. Manual PIN, offline sync, witness confirmation and GPS evidence
remain previews. The staff interface must not assume that a role alone permits
arbitrary database writes.

## Payment integrity

The hardening migration adds NGN currency/maximum constraints,
one-payment-per-offering and provider transaction uniqueness, audited offering
changes, and `settle_paystack_payment`. Settlement checks trusted payment
details and writes the payment, offering status, audit and event records in one
transaction. Member verification and webhooks share this settlement operation.

The November migration enforces a ₦500 minimum on new offering inserts and
amount changes. It deliberately allows status-only updates to historical
transactions so a legacy pending payment can still be verified and settled.

Offerings use decimal naira; provider amounts use integer kobo. Financial foreign
keys restrict deletion instead of cascading through payment history. Retention,
anonymization, refunds, reconciliation and account deletion need explicit design.
Existing duplicate or invalid data can prevent a migration from applying; do not
delete records just to force it through.

## Current identity and attendance boundaries

The November migration allows email/password sign-up to create a normal
unverified member profile using `full_name` from Auth metadata even when
`auth.users.phone` is null. The submitted phone is not copied to the canonical
phone column until the backend verifies it. Role and `is_verified` values from
metadata are ignored.

Giving and QR check-in require provider-confirmed email or phone. This contact
verification rule is separate from staff membership verification; an usher or
administrator does not approve ordinary member access. `is_verified` remains
part of staff-role authorization.

The new QR function uses the existing `services.qr_code` value and the service
date/start/end times. The QR is static, so a screenshot can be shared during the
allowed window. Rotating signed codes or another accepted presence method must
be agreed before public release. Manual PIN, offline queues, 24-hour sync,
witness confirmation and GPS capture still lack connected server contracts.

The current profile schema does not persist age from Auth metadata. Agree on a
date-of-birth or age-data contract before storing it as a member field.

The broader release also needs data/workflow design for badges, sponsor
invitations, worker-roster approvals, sermons and weekly church messages.

## Verification boundaries

`supabase/tests/access_and_payment_regression.sql` contains database regression
checks for profile provisioning, access controls, the minimum and settlement.
Run database tests only against a disposable local development database after
reviewing setup and permissions. Their presence is not proof that the migration
was applied to a hosted project.
