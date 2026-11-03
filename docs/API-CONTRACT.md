# TPC Church App API Contract

**Revision:** 3.0 (3 November 2026)
**Release:** Internal alpha
**Status:** Source changes are prepared locally; hosted migrations, function
deployments and end-to-end results are not yet verified.

## Security boundaries

- The mobile app uses only the Supabase project URL and anon/publishable key.
- Supabase service-role and Paystack secret keys stay in Edge Function secrets.
- Member endpoints validate the bearer token with Supabase Auth. They derive the
  member ID from that verified user, never from request JSON.
- Database row-level security and grants remain authoritative. A UI state,
  profile flag, browser return or QR scan alone does not prove payment or
  attendance.
- The iOS and Android Supabase clients persist auth sessions in Expo SecureStore
  chunks; the manifest switches only after all new chunks are written. The web
  preview uses AsyncStorage. Existing native AsyncStorage sessions migrate on
  first read. Test session refresh, reinstall behavior and sign-out on physical
  devices before public release.

## Member identity and profile provisioning

The internal alpha currently creates accounts with email and password. Members
must confirm their email before giving or checking in. Phone OTP is not connected
yet. When phone Auth is added, a server-confirmed phone can satisfy the same
contact-verification rule.

The new migration makes `profiles.phone` nullable and provisions a normal,
unverified `member` profile when Auth metadata contains a non-empty `full_name`.
It also creates the related `members` row. A submitted phone in email-sign-up
metadata is not copied into the canonical phone column because it has not been
verified. The trigger never accepts role or verification values from metadata.

Contact verification grants ordinary member access to these member endpoints.
`profiles.is_verified` remains relevant to protected staff-role authorization;
it does not make an usher or administrator approve an ordinary member account.

Age currently remains in Auth metadata. A later profile-data contract should
define whether the application stores date of birth or another age representation
before the backend persists it as member data.

## Active giving funds

The member app loads rows from `public.funds` where `is_active = true`. It sends
the selected real fund UUID and does not invent fund IDs. `seed.sql` contains
Offering, Tithe, Building, Missions, Evangelist support and Church outreach
examples for local development. Seed data does not activate funds in a hosted
project. A church administrator must publish the intended live funds there.

The current schema has no explicit category field. The app temporarily maps fund
names to Offering, Tithes, Property, Church mission, Evangelist and Church
outreach program. Add an explicit backend category before administrators create
arbitrary fund names or campaigns.

## `POST /functions/v1/offerings-initialize`

Requires a confirmed Auth email or phone and a profile row. The caller must send
JSON with a selected active fund:

```json
{
  "amount": 500,
  "fund_id": "11111111-1111-4111-8111-111111111111"
}
```

`amount` is naira, between ₦500 and ₦1,000,000, with at most two decimal places.
The endpoint validates the minimum, creates a server-owned pending offering,
then initializes Paystack in NGN. It returns the Paystack initialization shape
needed by the app: `status`, `data.authorization_url`, `data.access_code` and
`data.reference`.

The server supplies an HTTPS `paystack-return` callback. That endpoint validates
the reference format and redirects to the fixed `tpc://payment-return` app link;
the app then calls `offerings-verify`. The callback does not report or prove
success. Standalone iOS/Android builds use the app link; Expo Go and web preview
fall back to returning manually and checking status. Opening or closing a
browser never marks a gift successful.

Expected failures include `UNAUTHORIZED`, `CONTACT_NOT_VERIFIED`,
`INVALID_AMOUNT`, `INVALID_FUND`, `INACTIVE_FUND`, `PROFILE_INCOMPLETE` and safe
provider/configuration errors. Responses must not expose credentials, raw
provider payloads or database error text.

## `POST /functions/v1/offerings-verify`

Requires the same confirmed caller and accepts only the caller's own reference:

```json
{ "reference": "TPC-generated-reference" }
```

The server verifies the reference with Paystack and calls the atomic
`settle_paystack_payment` database function. Only a matching verified provider
transaction may produce `{"status":"successful"}`. Other supported responses
include `abandoned`, `failed`, `ongoing`, `pending`, `processing`, `queued` and
`reversed`. The client displays server status; it cannot submit a success result.

The migration enforces ₦500 on newly inserted offerings and amount changes while
allowing status-only updates to historical transactions. Provider settlement
still accepts an existing ₦100-or-higher transaction when it exactly matches a
pending legacy offering; it cannot create a new sub-₦500 offering.

## Paystack return and webhook

`paystack-return` is a public, no-secret redirect endpoint because Paystack
cannot send a member JWT to the callback. It accepts only a validated reference
and uses a fixed app scheme, so it cannot be used as an arbitrary redirect. It
never changes payment state. `GET /functions/v1/paystack-return` redirects to
`tpc://payment-return` with the validated reference or a fixed error code.

`paystack-webhook` verifies the signature against the original request body with
HMAC SHA-512. It uses the same settlement function as member verification so
duplicate provider events cannot create duplicate payment rows. JWT verification
is disabled only for the webhook and fixed redirect route; the webhook validates
the provider signature, while the redirect cannot change payment state.

The app does not hardcode payment channels. Paystack checkout determines which
methods it offers based on the merchant account, transaction and device. Confirm
Apple Pay, Google Pay and bank-transfer availability with the church's Paystack
test account before describing them as supported.

## `POST /functions/v1/attendance-check-in`

Requires a confirmed Auth email or phone and an existing profile. The request
contains the exact QR value stored on an active service:

```json
{ "qr_code": "service-qr-value" }
```

The endpoint resolves the service on the server, applies a WAT check-in window
from 30 minutes before service start through 30 minutes after service end,
checks for an existing member/service record and inserts attendance using the
server-only service role. A repeated scan returns `already_checked_in`; a new
record returns `confirmed`, `service_title` and `checked_in_at`. Direct member
attendance inserts remain revoked.

The current QR value is static for the service. The time window does not prove
physical presence if somebody shares a screenshot. A rotating signed QR or
another approved presence check remains a release-hardening item. Manual usher
PIN, offline synchronization, witness confirmation and GPS evidence remain UI
previews and are not connected to this endpoint.

## Deployment and verification

Apply the new migration after the existing schema and hardening migrations, then
deploy `offerings-initialize`, `offerings-verify`, `paystack-webhook`,
`paystack-return` and `attendance-check-in` to the intended development project. Confirm the runtime
secrets there and use Paystack test credentials before testing checkout. Do not
copy any secret into the app or repository.

`supabase/tests/access_and_payment_regression.sql` covers profile provisioning,
privilege boundaries, the minimum and payment settlement against a disposable
local database. Mobile tests cover input validation, response parsing, secure
storage behavior, payment-return parsing and the attendance time window. The
Deno payment helper test covers new-gift amount boundaries and confirms that a
provider payload at the original NGN 100 floor can be normalized for the
settlement call. It does not exercise the database settlement RPC. These checks
still need to run on the current working copy. Repository source does not prove
the hosted project has these migrations or functions deployed.
