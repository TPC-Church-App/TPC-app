# TPC Church App - API Contract

**Revision:** 1.1 (29 October 2026)
**Status:** Repository implementation reference; hosted behaviour unverified.

## Boundaries

The mobile app currently renders a welcome screen and phone/email sign-in UI.
It does not call Supabase Auth or payment functions. This contract describes
existing payment source code and identifies the missing integration contracts.
It does not imply that functions are deployed or production-ready.

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

- `amount`: numeric naira, 100 to 1,000,000 inclusive, at most two decimals.
  These are current code limits; final configurable product limits remain open.
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
and the mobile return flow are not implemented in this repository. A callback
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
