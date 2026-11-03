# PR #5 Update

## Suggested title

fix(auth): align member access, payments and check-in flows

## Description

### Summary

- Provision email/password alpha accounts as ordinary member profiles when
  Supabase Auth provides a name, even when the Auth phone field is empty.
- Keep contact verification separate from usher/admin approval. Staff role
  checks continue to require the protected staff verification state.
- Enforce the ₦500 minimum in the mobile validator, Edge Function and database
  for new or repriced offerings while preserving status updates to old gifts.
- Keep Paystack checkout in a secure HTTPS browser handoff. The HTTPS callback
  returns a validated reference to the standalone app, which verifies it with
  the server. Expo Go/web use manual return; no browser return proves success.
- Scope payment history to the signed-in member, connect QR scanning to the
  authenticated attendance endpoint and apply the WAT service window server-side.
- Add local fund examples, regression coverage, pull-request CI checks and
  cross-platform LF handling.

### Validation

Pending on the current PR commit: Prettier, TypeScript, mobile/shared tests,
Deno Edge Function type checks and payment tests, disposable-database SQL
regression checks, Expo SDK/Doctor checks, iOS/web exports, and iPhone/browser
acceptance.

### Alpha limitations

- Email/password with confirmed email is temporary internal-alpha access; phone
  OTP is not connected.
- The hosted database migration and Edge Functions still need reviewed
  deployment. Local source changes do not prove hosted behavior.
- Paystack testing must use test credentials. Standalone native builds use the
  return callback; Expo Go/web require manual return and server verification.
- QR values remain static and can be shared during the allowed service window.
  Manual PIN, offline sync, witness confirmation and GPS remain previews.
- Member age remains Auth metadata; no profile age field is defined yet.
- Native auth sessions use chunked Expo SecureStore with an atomic manifest
  switch and migrate existing AsyncStorage sessions on first read; web preview
  sessions use AsyncStorage. Verify refresh and logout on physical iOS and
  Android before broader release.
- The last audit output shared for this branch reported 12 moderate findings in
  the mobile dependency tree. Re-run the audit against this exact lockfile;
  forced Expo dependency upgrades are intentionally excluded from this change.
