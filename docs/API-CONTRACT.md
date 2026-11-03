# TPC Church App - API Contract

**Revision:** 1.3 (3 November 2026)
**Status:** Repository implementation reference; hosted behaviour unverified.

## Boundaries

The mobile app connects email/password sign-in to Supabase Auth and invokes the
offering initialization and verification functions. The camera scanner is an
alpha preview only: it detects a QR code and explicitly reports that it did not
record attendance. No `attendance-check-in` function or agreed response
contract appears in this repository branch. Offline attendance and witness
controls remain demos. This contract describes checked-in source, not proof that
hosted functions or database policies are deployed and working.

Local function base: `http://localhost:54321/functions/v1`.
Hosted base: `https://<project-ref>.supabase.co/functions/v1`.
A physical phone's `localhost` refers to the phone, not the development laptop;
local phone integration needs a reachable development host and verified setup.
Supabase Auth and database client calls use their own APIs, not this function base.

## Authentication and current policy mismatch

Member payment functions require `Authorization: Bearer <access-token>` and
validate the caller with Supabase Auth. JSON requests use
`Content-Type: application/json`. Gateway/client-key configuration must also be
verified for the target Supabase project; a service-role key never belongs in a client.

Current handlers additionally require `profiles.is_verified = true`; otherwise
they return `403 MEMBERSHIP_PENDING`. This is legacy implementation behaviour.
The confirmed product requirement grants ordinary member access immediately
after phone or email OTP verification, without usher/admin approval. Profile
provisioning and these checks need reviewed backend changes before integration.
Do not make the frontend set protected role or verification fields.

Registration currently collects a self-reported whole-number age. The UI
rejects values below four; the backend must validate the same boundary before
creating or updating a profile. This entry does not verify a person's age or
identity.

## Response conventions

The current functions do not share a uniform success envelope. Clients must use
the endpoint-specific shapes below. Changing this later requires coordinated
contract and handler changes.

Handler errors use this structure (example):

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sign in to initialize an offering."
  }
}
```

Infrastructure/gateway failures may have other response shapes. Handle HTTP
status, unexpected bodies and network failure without assuming JSON success.

## POST /offerings-initialize

Source: `supabase/functions/offerings-initialize/index.ts`.

Example body (synthetic values):

```json
{
  "amount": 1000,
  "fund_id": "11111111-1111-4111-8111-111111111111",
  "email": "member@example.com"
}
```

- `amount`: numeric naira, currently 100 to 1,000,000 inclusive in the checked-in
  handler, at most two decimals. Product policy requires a ₦500 minimum. The
  backend handler and tests must enforce 500 before the alpha handoff; frontend
  validation alone does not protect the endpoint.
- `fund_id`: UUID of an existing active fund. The example UUID is not seed data.
- `email`: checkout email when Auth supplies none. The handler prefers `user.email`.
- Ownership, reference, NGN currency and pending status are assigned server-side.
- The backend converts naira into integer kobo for Paystack.

On HTTP 200, the handler returns Paystack's initialization object. It validates
`status: true`, matching `data.reference`, nonempty `data.access_code` and an
HTTPS `data.authorization_url`. Other provider fields may also be present.

```json
{
  "status": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/example",
    "access_code": "example-code",
    "reference": "TPC-example-reference"
  }
}
```

The callback is constructed as `APP_URL/payment/callback`; that destination
is not connected; the mobile demo return route is a separate scenario preview and does not receive live Paystack callbacks. A callback
or checkout screen is never proof of successful payment.

Initialization creates a fresh offering/reference per request. Client retry
idempotency is not implemented: do not automatically retry an uncertain request
as though it were guaranteed to reuse the first offering. A provider timeout can
leave an offering pending; reconciliation remains unfinished.

## POST /offerings-verify

Source: `supabase/functions/offerings-verify/index.ts`.

```json
{
  "reference": "TPC-example-reference"
}
```

The reference must be 1-100 characters from letters, digits, `.`, `_`, `=`, `-`.
The handler looks up only the caller's own offering before contacting Paystack.
Successful provider verification is settled through a database transaction.
Only after settlement is confirmed does it return:

```json
{
  "status": "successful"
}
```

A recognized non-success provider status returns HTTP 200 with `status` equal
to `abandoned`, `failed`, `ongoing`, `pending`, `processing`, `queued` or
`reversed`. HTTP 200 alone therefore does not mean the payment succeeded.
Those non-success results do not implement a full refund/reversal workflow.
Repeated successful settlement is guarded against duplicate payment records.

## Mobile payment handoff

`supabase.functions.invoke('offerings-initialize', ...)` returns the function's
JSON body as `data`. The mobile app must read the nested Paystack fields at
`data.data.authorization_url`, `data.data.access_code` and
`data.data.reference`; a flat `data.checkout_url` response is not the current
handler contract. Before opening the URL, the app checks the successful
initialization flag, required fields and HTTPS Paystack checkout host.

The app opens the hosted Paystack page and asks the member to return to TPC and
request a status check. An Android browser result of `opened` means only that the
browser launched. A closed or cancelled browser also does not prove payment. The
app calls `offerings-verify` with the reference and marks a gift successful only
when the server returns `{"status":"successful"}`. Pending, failed, abandoned,
reversed and unrecognized outcomes remain visibly distinct. The current
`APP_URL/payment/callback` destination is not connected to a mobile deep link or
verified web return page, so callback-based return handling remains unfinished.

Payment selection stays within Paystack's secure hosted checkout. Available
methods depend on the church Paystack account configuration, transaction
currency and provider/device eligibility. The app must not claim Apple Pay,
Google Pay, bank transfer or card availability before Paystack returns or shows
that method for the actual transaction.

## Attendance check-in contract still required

The current scanner does not send the scanned value to a server or claim that
attendance was recorded. No checked-in `attendance-check-in` function or agreed
response schema exists in this branch. This confirms a repository gap; it does
not prove that no function was deployed manually in the hosted project.

Proposed response contract for backend review: return HTTP success and
`{ "status": "confirmed", "service_title": "..." }` only after signed,
service-specific pass validation and caller authorization succeed. The backend
owner must agree the request and response schema, enforce replay protection and
idempotency, and add function tests before the mobile client connects this flow.

## POST /paystack-webhook

Source: `supabase/functions/paystack-webhook/index.ts`.

Provider-to-server only; mobile applications must not call this endpoint.
`x-paystack-signature` authenticates the original body with HMAC SHA-512.
The Supabase config disables gateway JWT verification only for this function;
the handler still requires a valid provider signature.

A valid `charge.success` is settled atomically. Successful acknowledgement is
`{"received":true}`. Other signed event types receive
`{"received":true,"ignored":true}` and are not treated as completed payment work.
Database failures return an error rather than a false successful acknowledgement.

## Error categories

| HTTP status | Examples from handlers                                              |
| ----------- | ------------------------------------------------------------------- |
| 400         | Invalid JSON, amount, fund, email, reference or event               |
| 401         | Missing/invalid member token or webhook signature                   |
| 403         | Current legacy membership verification gate                         |
| 404         | Offering unavailable to the caller / settlement reference not found |
| 405         | Unsupported HTTP method                                             |
| 409         | Provider/stored payment mismatch or conflicting settlement          |
| 413         | Request body exceeds handler limit                                  |
| 415         | Member request is not application/json                              |
| 500         | Configuration, profile lookup, persistence or settlement failure    |
| 502         | Payment-provider failure or malformed provider response             |

Member handlers also answer OPTIONS preflight requests. The webhook accepts POST only.

## Contracts still required

Define and test each contract before its frontend integration:

- Phone/email OTP request, verification, session refresh, logout and recovery.
- Profile completion and immediate ordinary-member access.
- Service discovery, service-specific QR passes and check-in windows.
- Consent-based offline evidence, upload within 24 hours of service end,
  duplicate handling and eligible-member witness confirmation.
- Histories, receipts, notifications and staff operations.
- Badges, sponsor invitations, worker-roster approvals, sermons and messages.

These are planned capabilities, not available endpoints. Track completion in
README.md rather than creating a second competing progress checklist.

## Member-demo adapters and proposed catalog contract (30 October 2026)

The current branch uses Supabase Auth, the two offering functions described
above, and a direct member-owned `offerings` history query. The history page
reloads when it becomes active. The attendance scanner currently provides only
a camera preview and does not submit attendance. Offline attendance, witness
confirmation, other member screens and the demo workspace remain device-local;
they do not create shared member records or prove server outcomes. Hosted
behaviour still needs an environment-specific acceptance check.

The backend owner must agree a fund/campaign discovery contract before live checkout. Proposed fields: stable UUID `id`, display `name`, `description`, category (`offering`, `tithe`, `property`, `mission`, `evangelist`, `outreach`, or `other`), `is_active`, currency, display order, optional campaign dates and updated-at/version. These are adapter requirements, not confirmed database fields or an available endpoint. Agree whether campaign dates affect checkout eligibility, fund archival and retention of historical names/categories. The current mobile UI temporarily groups legacy fund names by keywords; unknown active funds appear under Other active funds. Add a server-owned category field so renamed funds and administrator-created campaigns do not depend on name matching. The server remains authoritative for availability, amount limits and ownership; the frontend must not create/activate funds.

History needs cursor pagination, fund/category snapshots, integer minor-unit amount, currency, reference, created/updated timestamps and authoritative payment status. Receipts need a server-owned receipt identifier and eligibility decision; client return parameters and HTTP 200 alone never establish success. Map all statuses documented above. Demo replay rules only protect the local preview and do not implement reconciliation or refunds.

Remaining member contracts also need media/content URLs and permissions, notification/read/preference semantics, profile/photo storage limits, department request decisions and server-granted roles, roster availability/approval states, both newcomer and financial-sponsorship invitations, and witness eligibility/consent. Financial sponsorship must not imply approval or funding from a prepared request. Contact details, bank information and staff roles must not be inferred from demo data.

## Partner review required before live integration

The member UI needs an agreed backend contract and environment-specific acceptance. No agreement is recorded on behalf of the backend owner. Confirm: (1) phone/email OTP request/verification/resend, expiry, errors and session response; (2) email/password alpha signup profile provisioning, profile creation/fetch/update and photo storage; (3) the attendance endpoint and exact `confirmed` response, signed QR validation, witness eligibility and offline evidence/idempotency; (4) ₦500 minimum enforcement in the initialize handler and database constraint, active fund/campaign discovery, checkout return, reconciliation, paginated history and receipt eligibility; (5) ordinary member access after contact verification without usher/admin approval; (6) department/roster decisions and server-owned permissions; (7) content/media, read-state/preferences, badges and both sponsorship/invitation types.

Confirm successful, pending, rejected, expired, denied, network-error and retry responses for each relevant flow. The frontend owner connects these APIs and tests integrated behaviour after the backend owner supplies them. Native demo recovery and mock results do not establish production authentication or financial integrity.
