# TPC Church App - Development and Deployment Preparation

**Status:** Preparation guide, not a rehearsed production deployment runbook.
**Updated:** 3 November 2026.

## Current runnable application

The Expo mobile application uses Supabase email/password Auth and invokes the
Paystack offering initialization, verification and QR attendance functions.
Phone OTP remains unimplemented. A standalone app build returns through the
HTTPS `paystack-return` function and verifies status with the server. Expo Go
and web preview use manual return and server status check. The latest local
function and migration edits still need checks and deployment.
The staff Next.js application contains placeholders and cannot yet be built or
deployed. Checked-in source does not prove hosted deployment or behaviour.

### Local mobile preview

Prerequisites: Node.js, installed mobile dependencies, client-safe Supabase URL
and anonymous-key configuration, and Expo Go on the iPhone.
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
3. Apply and review the email-profile and ₦500-minimum migration in an isolated
   database, then run the SQL regression file.
4. Confirm Supabase email confirmation and recovery settings. Phone OTP is not
   part of this alpha. Contact verification does not use staff approval.
5. Configure Paystack test-mode credentials and confirm the app callback plus
   server-verification flow in a standalone build. Test the manual return in
   Expo Go/web. Do not use live credentials for alpha testing.
6. Verify QR check-in authorization, service window, duplicate scans and static
   QR sharing risk. Rotating codes remain a public-release hardening item.
7. Verify authorization, concurrency, webhook retries, reconciliation and failure
   recovery before moving to live credentials or real member data.

The root package includes the Supabase CLI dependency. Use that project-local
CLI and a reviewed environment-specific procedure. This guide intentionally
provides no copy-and-run production migration command before the prerequisites
and target project have been verified.

## Migration/function dependency

Apply the initial schema, hardening migration and then
`20261103090000_email_profiles_and_giving_minimum.sql` in order. The latest
payment functions depend on the hardening settlement function and new minimum
trigger. Do not deploy the edited functions before applying the required schema.

Deployable function directories currently contain code for:

- `offerings-initialize`
- `offerings-verify`
- `paystack-webhook`
- `paystack-return`
- `attendance-check-in`

Existence in the repository does not prove deployment. The webhook disables JWT
verification because it checks Paystack's HMAC signature. The return function
also disables JWT because Paystack cannot send a member token; it only redirects
to a fixed app scheme and cannot change payment state. Do not disable JWT checks
on member endpoints as a general workaround.

## Environment boundaries

The payment handlers read `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY`. The attendance handler
uses the Supabase URL, anon key and service-role key. Some Supabase values are
supplied by the runtime; verify the target project's supported configuration
before setting them manually.

Service-role and Paystack secret keys are server-only. Never place them in the
mobile bundle, browser code, source control, screenshots or shared logs. The
mobile app uses only the Supabase URL and anonymous key. Confirm Row Level
Security and project policy before sharing an alpha build.

## Release and rollback

Use the single README checklist for release status. Before release, verify the
mobile journeys on supported devices, resolve or explicitly assess remaining
security findings, rehearse database restore and payment reconciliation, and
obtain release approval. Record exact deployed migrations, function versions,
application builds and rollback compatibility. Hosted migrations, deployment,
live payments and recovery were not exercised in this documentation update.
