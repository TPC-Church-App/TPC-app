# TPC Church App - Database Implementation Notes

**Reviewed against repository migrations:** 29 October 2026.
**Hosted state:** Not inspected or migrated during the mobile foundation update.

## Sources and order

1. `supabase/migrations/20261021194959_initial_schema.sql` defines the initial schema.
2. `supabase/migrations/20261022090000_harden_access_and_payments.sql` restricts
   writes, adds integrity constraints and provides atomic payment settlement.
3. `supabase/seed.sql` contains development seed data.

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

Seed funds are Tithe, Offering, Building and Missions. The presence of a table
or seed entry does not establish that its application workflow is implemented.

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

In particular, ushers cannot directly insert attendance through the ordinary
client. Trusted check-in operations still need implementation. The staff
interface must not assume that a role alone permits arbitrary database writes.

## Payment integrity

The hardening migration adds NGN currency/amount constraints, one-payment-per-
offering and provider transaction uniqueness, audited offering changes, and
`settle_paystack_payment`. Settlement checks trusted payment details and writes
the payment, offering status, audit and event records in one transaction.
Member verification and webhooks share this settlement operation.

Offerings use decimal naira; provider amounts use integer kobo. Financial foreign
keys restrict deletion instead of cascading through payment history. Retention,
anonymization, refunds, reconciliation and account deletion need explicit design.
Existing duplicate or invalid data can prevent a migration from applying; do not
delete records just to force it through.

## Confirmed requirements not yet reflected in the schema/workflows

Current profile provisioning requires a phone and full name in Auth registration
and creates an unverified member profile. It is not complete email onboarding.
Current payment handlers still enforce staff-managed membership verification.

Confirmed requirements instead grant ordinary member access after phone or email
OTP verification, without usher/admin approval. Resolve that mismatch through
reviewed backend changes while preserving staff authorization boundaries.

Service QR issuance, attendance-window enforcement, consent-based GPS/time
capture, offline queues, 24-hour synchronization and eligible-member witness
confirmation are not completed by the existing attendance table. Witness
confirmation must not introduce an usher/admin approval requirement.

The broader release also needs data/workflow design for badges, sponsor
invitations, worker-roster approvals, sermons and weekly church messages.

## Verification boundaries

`supabase/tests/access_and_payment_regression.sql` contains database regression
checks. `supabase/functions/_shared/payments.test.ts` contains pure helper tests.
Run database tests only against an isolated development database after reviewing
setup and permissions. Historical test results are recorded in README.md;
they are not proof of the hosted project's state or current deployment readiness.
