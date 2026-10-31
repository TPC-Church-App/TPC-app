# Member UI handoff — final validation and manual Git steps

Branch: chore/member-home-ui. Target: dev. The current milestone covers the member demo UI. Staff dashboard and real backend integration remain separate work.

The user reported passing format:check, TypeScript and the original 23 tests before the final review fixes. The updated suite contains 41 cases. The supplied post-fix log confirms Prettier write/check, TypeScript and 41/41 tests passed. The expo-asset peer is now installed; SDK alignment, Doctor 20/20 and both iOS/web exports passed in supplied output. Audit completed with eight findings (five low, three high) requiring review. The user confirmed both iPhone and browser acceptance passed on 31 October 2026. The assistant has formatted/parsed source through libraries and has not run terminal commands, tests, builds or Git operations.

## What changed and what to send your partner

- [Milestone history](MEMBER-UI-CHANGELOG.md): member journeys, review corrections, comments and evidence.
- [Copy-ready PR title and description](PR-MEMBER-UI.md): replace pending validation rows with actual output.
- [Acceptance cases](MEMBER-UI-TEST-PLAN.md): iPhone/browser checks and expected results.
- [API contract](API-CONTRACT.md): existing backend behaviour, proposed adapter fields and questions requiring partner agreement.

The final fixes unify name limits, protect saved data after failed loading, recover damaged metadata by explicit reset, restore requested schedule tabs on focus and cancel late audio playback. Reset errors appear in the open confirmation sheet. Native storage uses a tested injectable core; the browser keeps its adapter and GPS exclusion. No dependencies were added by this correction pass.

## Completed follow-up: required audio peer

The user installed expo-asset with Expo. SDK alignment, Doctor 20/20 and both iOS/web exports subsequently passed. Formatting, TypeScript and all 41 model tests also passed. The current audit still reports eight findings; preview compatible remediation and review the open security entries before release.

## 1. Run Prettier write/check, TypeScript and all tests

This command actually formats the saved files first. A previous format:check only checked them. Scripts cover mobile source, services, stores, tests, parked routes, admin scaffolds, JSON configuration and project documentation. Generated files and lockfiles stay outside the formatter.

```powershell
# ===============================================================
# FORMAT AND VALIDATE THE FINAL MEMBER UI FIXES
# Run in order; each failure stops the block for inspection.
# Expected test inventory: 41 cases, with no failures or skips.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'
foreach ($tpcCheck in @('format', 'format:check', 'typecheck', 'test')) {
    & 'C:\Program Files\nodejs\npm.cmd' run $tpcCheck
    if ($LASTEXITCODE -ne 0) { throw "$tpcCheck failed. Share the complete output." }
}
```

## 2. Check SDK compatibility and export iOS/web

The SDK check reports version mismatches. Doctor checks configuration/native dependency alignment. Exports build locally without publishing. Audit reports advisories; do not apply forced fixes automatically.

```powershell
# ===============================================================
# CHECK EXPO AND BUILD BOTH LOCAL FRONTEND BUNDLES
# --max-workers 2 limits bundler workers on the laptop.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'
& 'C:\Program Files\nodejs\npm.cmd' exec -- expo install --check
if ($LASTEXITCODE -ne 0) { throw 'Expo compatibility check failed.' }
& 'C:\Program Files\nodejs\npm.cmd' exec --yes --package=expo-doctor@latest -- expo-doctor
if ($LASTEXITCODE -ne 0) { throw 'Expo Doctor found issues. Share the report.' }
foreach ($tpcPlatform in @('ios', 'web')) {
    & 'C:\Program Files\nodejs\npm.cmd' exec -- expo export --platform $tpcPlatform --max-workers 2
    if ($LASTEXITCODE -ne 0) { throw "$tpcPlatform export failed. Share the complete error." }
}
```

Run this separately and record the result. An advisory report can return nonzero even though the command ran successfully; assess its contents with your partner.

```powershell
# ===============================================================
# RECORD CURRENT DEPENDENCY ADVISORIES WITHOUT CHANGING PACKAGES
# ===============================================================
& 'C:\Program Files\nodejs\npm.cmd' audit
```

## 3. Restart Expo and check the current UI

Stop the old server using Ctrl+C. Leave the following terminal running. Scan its QR code on the iPhone; press w in that terminal for web.

```powershell
# ===============================================================
# RESTART THE FINAL DEMO FOR DEVICE AND BROWSER ACCEPTANCE
# --offline skips Expo service lookups, not local Wi-Fi preview.
# --clear refreshes Metro; --port 8082 uses the established port.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app\apps\mobile'
& 'C:\Program Files\nodejs\npm.cmd' run start -- --offline --clear --port 8082
```

Prioritize these checks before pushing, then cover the full acceptance plan:

1. Get started → valid member details → phone/email → demo OTP 123456 → Home. Wrong code and age below four reject. Save Profile/photo, reload, return through Sign in and explicitly load the saved device profile.
2. Request a department, preview approval, open Community and choose another tab. Return to Profile and use the schedule shortcut again: Rosters & schedules opens. Save department changes explicitly.
3. Exercise both invitations, messages/preferences, giving → checkout → return → history/receipt and attendance → manual sample code/QR → GPS or witness → queue → retry/result. No real sending, payment or approval is claimed.
4. Finish the sample audio, replay it and leave/background immediately; it must stay stopped. Check normal play/pause/seek. Repeat navigation through every menu item, especially Giving.
5. Test large text, keyboard/VoiceOver, scrolling/sheets, Reduce Motion, permission denial and queue save/reload. In Settings, cancellation preserves data; confirmed reset clears the demo. Loading failures must offer retry and block ordinary saves; automated cases cover corrupt metadata and interrupted writes without requiring you to damage real device storage.

Record actual acceptance results in PR-MEMBER-UI.md. Server API agreement requires your partner's response; it cannot be completed by the assistant on their behalf.

## 4. Review Git changes and finish the PR description

After checks pass, inspect every changed/untracked file in VS Code Source Control. Review staged files too, particularly if something was already staged before this milestone. The following commands inspect the branch and refresh remote metadata without merging.

```powershell
# ===============================================================
# REVIEW THE BRANCH BEFORE STAGING OR COMMITTING
# dev is the integration branch; no main branch is used here.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app'
$tpcReviewBranch = git branch --show-current
if ($LASTEXITCODE -ne 0 -or $tpcReviewBranch -ne 'chore/member-home-ui') {
    throw 'Unexpected branch. Inspect Git status before continuing.'
}
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed. Share the Git output.' }
git status --short --branch
git --no-pager diff --stat origin/dev
git --no-pager diff --cached --stat
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Resolve diff warnings before staging.' }
```

Copy the title/body from PR-MEMBER-UI.md. Update the validation table with the current 41-test output, Expo results, audit findings and device/browser results. The original 23 passing tests describe the earlier snapshot only. Do not claim that a review or merge occurred before it happens.

## 5. Commit and push the reviewed milestone

Run only after the checks and file review above. Include the existing branch's mobile changes and the prepared documentation. Stage other files only if they belong to the reviewed milestone. No reset, force push or automatic merge is needed.

```powershell
# ===============================================================
# SAVE AND PUSH THE REVIEWED MEMBER DEMO
# The branch guard protects the current work branch.
# ===============================================================
Set-Location -LiteralPath 'C:\Users\Josiah\Documents\TPC-app'
$tpcPushBranch = git branch --show-current
if ($LASTEXITCODE -ne 0 -or $tpcPushBranch -ne 'chore/member-home-ui') {
    throw 'Unexpected branch. Stop before committing.'
}
git add -- apps/mobile apps/admin package.json README.md docs/API-CONTRACT.md docs/MEMBER-UI-HANDOFF.md docs/MEMBER-UI-TEST-PLAN.md docs/MEMBER-UI-CHANGELOG.md docs/PR-MEMBER-UI.md
if ($LASTEXITCODE -ne 0) { throw 'Staging failed.' }
git --no-pager diff --cached --stat
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff verification failed.' }
git commit -m "feat(mobile): add member demo journeys and reliable local persistence"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed. Share the output.' }
git push --set-upstream origin chore/member-home-ui
if ($LASTEXITCODE -ne 0) { throw 'Push failed. Share the output.' }
git status --short --branch
```

Open the GitHub PR with base dev and compare chore/member-home-ui. Paste the prepared title/body and request your partner's review. Wait for that review/merge before starting a new branch.

## Handoff boundary

You can share API requirements and the demo while your partner works on backend endpoints. You still own frontend integration and acceptance against those endpoints. The staff web dashboard and distribution artwork remain frontend work outside this member-demo milestone. Real sending/verification/payment/approval ticks must wait for their authoritative responses, not a timer, valid input or return URL.
