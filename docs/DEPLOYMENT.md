# TPC Church App - Development and Deployment Preparation

**Status:** Preparation guide, not a rehearsed production deployment runbook.
**Updated:** 29 October 2026.

## Current runnable application

The Expo mobile application has welcome and phone/email sign-in interfaces.
OTP submission, sessions and backend integration remain unimplemented. The staff
Next.js application contains placeholders and cannot yet be built or deployed.

### Local mobile preview

Prerequisites: Node.js, installed mobile dependencies, and Expo Go on the iPhone.
Use the same Expo account and trusted Wi-Fi network on laptop and phone.

```powershell
# ===============================================================
# START THE MOBILE DEVELOPMENT SERVER
# Keep the terminal running while previewing the application.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'
& 'C:\Program Files\nodejs\npm.cmd' run start
```

Scan the QR code with the iPhone camera and open Expo Go. Allow local network
access if prompted. Ctrl+C stops the server. In a second terminal in the same
folder, run the `typecheck` script to check TypeScript. The mobile lockfile records
the installed dependency resolution; avoid forced framework upgrades.

Expo Go preview is not a signed distributable application. Store distribution,
identifiers, signing credentials, development builds and EAS configuration have
not been prepared. The dependency findings tracked in README.md remain open.

## Backend deployment prerequisites

Before running any remote migration or deployment:

1. Identify the target development/staging/production project explicitly and
   inspect its actual migration and function state.
2. Validate migrations and regression checks in an isolated database, including
   data compatibility, backup and restore procedures.
3. Resolve the phone/email onboarding and immediate-member-access mismatch
   documented in DATABASE.md and API-CONTRACT.md.
4. Configure and test Auth providers, limits, recovery and callback URLs.
5. Configure Paystack test-mode integration and a real application return flow.
   The code expects `APP_URL/payment/callback`; that route is not implemented.
6. Verify authorization, concurrency, webhook retries, reconciliation and failure
   recovery before moving to live credentials or real member data.

The root package includes the Supabase CLI dependency. Use that project-local
CLI and a reviewed environment-specific procedure. This guide intentionally
provides no copy-and-run production migration command before the prerequisites
and target project have been verified.

## Migration/function dependency

Apply the initial schema and then the hardening migration in order. Updated
payment functions depend on the hardening migration's constraints and settlement
function. Do not deploy those handlers against the initial schema alone.

Deployable function directories currently contain code for:

- `offerings-initialize`
- `offerings-verify`
- `paystack-webhook`

Existence in the repository does not prove deployment. The webhook's config has
`verify_jwt = false` because its handler checks the Paystack HMAC signature.
Do not disable gateway JWT checks on member endpoints as a general workaround.

## Environment boundaries

The payment handlers read `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` and, for initialization,
`APP_URL`. Some Supabase values are supplied by the runtime; verify the target
project's supported configuration before setting them manually.

Service-role and Paystack secret keys are server-only. Never place them in the
mobile bundle, browser code, source control, screenshots or shared logs. Client
configuration is not connected yet; only client-safe project configuration may
be exposed when that integration is implemented.

## Release and rollback

Use the single README checklist for release status. Before release, verify the
mobile journeys on supported devices, resolve or explicitly assess remaining
security findings, rehearse database restore and payment reconciliation, and
obtain release approval. Record exact deployed migrations, function versions,
application builds and rollback compatibility. Hosted migrations, deployment,
live payments and recovery were not exercised in this documentation update.
