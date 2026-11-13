# Calibr release audit — 13 November 2026

The selected core workflows passed the checks below. This is evidence for a local release candidate, not a guarantee that every device, dataset or interaction is free of defects. Email-link setup remains outstanding before a public launch.

## Verification results

- `npm test`: **227 checks passed**, including all original replay tests and all Calibr workflows. The default test command now includes the Calibr suites so future checks cannot silently test only the older product.
- `npm run test:build`: passed. The release entry, 42 local HTML asset references, runtime JavaScript syntax, pinned Supabase SDK and generic replay transformations were checked. SQL, development tools, backups, QA images and raw local imports are excluded.
- Existing-account sign-in, real cloud save/resume and administrator approval/denial were verified in the earlier live integration pass. The current database isolation and cloud adapter suites passed again. No cloud account data was modified by this release-artifact browser audit.
- The current Supabase security advisor returned one pre-existing warning: leaked-password protection is disabled. No new database/RLS warning was reported.

## Release issue found and fixed locally

The original `build.cjs` still packaged MicroBack instead of the reviewed Calibr app. It now exports Calibr and the same adapted generic workspace that `calibr/server.cjs` serves locally. Netlify can serve these files statically; Node is needed only during the build. The existing Netlify command and publish directory remain valid.

The built artifact is running locally at **http://127.0.0.1:4175/**. Development remains at **http://127.0.0.1:4174/**. Browser storage and authentication are separate between these two origins.

## Browser checks on the actual static artifact

Used an explicitly local-demo account and the synthetic MNQ sample, without a real trade or a new cloud upload.

1. Opened landing, sign-in, demo profile, Sessions and session creation. Verified the explicit Start session action and $50,000 starting balance.
2. Opened the black backtesting workspace with real chart-library rendering from the static output.
3. Created a three-unit buy-limit draft, edited prices, dragged the stop and checked monetary/percentage risk.
4. Changed quantity to two through the on-chart editor, submitted the limit and confirmed its fill at 18,399.75.
5. Dragged a live stop while replay remained running. It subsequently executed at 18,401.25, producing **$6**: 1.50 points × 2 units × $2 per point. Balance and equity became **$50,006**.
6. Opened three synced charts, enabled EMA 20 and reviewed the Performance panel. Saved, reloaded and resumed; trade, balance, replay index, layout, timeframes and indicator restored.
7. Created a trend line with native chart clicks. Undo removed it and enabled Redo; Redo restored it.
8. Rewound to candle zero. Later trade results disappeared, balance returned to $50,000, the order that existed at that point returned, and drawings remained.
9. Confirmed full Reset cleared trades, pending orders, drawings and practice time and returned replay to zero.
10. Changed display to UTC and jumped to the next historical market day. Panned and wheel-zoomed the chart; replay index remained **390** before and after navigation.
11. Created long and short position drawings. Both displayed central R:R 1:2.00 labels while the detailed tooltip disappeared away from hover. Created a path; all three drawings survived completion and reactivation.
12. Marked Completed: replay, order and drawing edits were disabled. Mark Active restored editing while retaining replay position and drawings.
13. Returned to Sessions. The reset session correctly showed zero closed trades and $50,000. No browser console warnings or errors were reported in this pass.

Screenshots: `preview-release-workspace.jpg` records the three-chart layout and $6 synthetic result before reset. This test does not establish tick-level execution accuracy, large-file performance or identical behaviour on every browser.

## Core scope and deliberate exclusions

Implemented: independent sessions/balances, profile-based library, private/public dataset review, manual market/limit execution, chart navigation/drawings, up to three synced charts, EMA/VWAP, rewind/reset, Active/Completed states, practice time, cloud persistence, session/overall dashboards and historical-period reports.

Journals, notebooks, automated strategy testing, stop-entry orders, partial exits, commissions/slippage and discipline limits are outside the selected current scope. One open position is supported. OHLC bars cannot establish the exact intrabar path. Drawdown is calculated from closed-trade balances. Cloud candle JSON is limited to 25 MB per dataset. The current real chart depends on the external pinned chart-library CDN; cloud access also requires internet. Only synthetic sample/QA datasets were available in this workspace, so real imported market datasets still need acceptance testing when provided.

## Remaining release steps

- **Authentication email links:** configure the approved production callback origin and complete sign-up, email-confirmation and password-reset round trips. These dashboard settings were explicitly deferred and are not claimed as verified. See `CLOUD_SETUP.md` and the root `DEPLOYMENT.md`.
- **Existing history:** the two old MicroBack sessions/profiles are preserved separately; automatic import into Calibr has not been implemented. This does not prevent new Calibr sessions, but must not be mistaken for an existing-data migration.
- **Password protection:** review the existing leaked-password warning in Supabase Auth. Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Review and explicitly approve the release before any Git push or Netlify deployment. Pushing the production branch may trigger Netlify automatically.

## Verified recovery copy

The local Git mirror contains **10 commits**. `git fsck --full` and `git bundle verify` passed. The bundle contains complete history plus the local preservation tag.

- Preserved main: `a97a1b958abf281b4925e1ae6107e6cff481fcb3`
- Local bundle: `backups/microback-before-calibr-2026-11-12.bundle`
- SHA-256: `C207CF4A826DD187E3E64D26B58AC820151ED88CF56347963DF4BBD5FB1F70DC`
- A separate pre-cloud workspace snapshot is retained under `backups/`.

Backups remain local and ignored by Git. No Git push, remote preservation tag or Netlify deployment was performed during this audit. The current workspace Git repository is still an uncommitted checkout; release preparation must retain the existing remote history rather than replace it with an unrelated initial commit.

## Approved release policy update — 13 November 2026

After the audit, the user selected basic email/password accounts for this phase and explicitly approved turning off Supabase Confirm email temporarily. Google OAuth, SMTP, email confirmation and password recovery are deferred. The earlier email-blocker checklist above records the pre-decision audit and is superseded by this approved limited release policy. Email ownership is not verified.

The production Site URL and nine exact local/production callback URLs were saved and verified. A disposable live auth test passed immediate signup, non-admin role assignment, incorrect-password rejection and correct-password sign-in after sign-out. The test account was removed. Existing real account data was retained.

A private GitHub repository, https://github.com/chxkavar/microback-backup, was created using GitHub's importer. It contains the original main commit a97a1b958abf281b4925e1ae6107e6cff481fcb3 and all 10 commits. The local mirror and bundle remain intact.
