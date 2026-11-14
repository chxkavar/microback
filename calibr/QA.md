# Phase 1 verification

Verified locally on 11 November 2026. No Git push, domain claim, deployment, or production-backend change was performed.

## Automated

- 21 domain/engine checks passed (`node calibr/verify.cjs`), including the account-panel layout and collapse/restoration checks added after the initial preview.
- All 109 existing workspace, session, store and database-isolation regression checks passed (`npm test`). Database tests use isolated PGlite, not the hosted database.
- Local HTTP returned 200. Adapted inline and external workspace scripts passed syntax checks. Production auth/configuration/storage scripts are absent from the local workspace document.

## Browser

- Landing page, Get started, local account-entry disclosure, demo profile, and Sessions navigation worked.
- A named sample session stayed in setup until Start session was clicked. The default balance was $50,000 and replay started at the first candle.
- A three-unit sample trade realised $25.50. Balance became $50,025.50 and survived leaving, resuming, and page reload.
- Uploaded the synthetic `fixtures/verification.csv`; 100 valid candles and its historical range were shown before starting.
- Configured point value 20 and quantity increment 0.001, with a $25,000 starting balance. A 0.5-unit trade from 100.05 to 100.15 realised $1 and produced a $25,001 balance.
- Returning to Sessions offered library saving. Creating the Index practice folder and saving privately made the dataset reusable.
- Re-selecting that saved dataset restored point value 20 and quantity increment 0.001, without opening replay automatically.
- A second profile showed no sessions or private uploaded datasets from the first profile. Only synthetic sample datasets were shared in this preview. This is UI/data separation within local storage, not production authentication or an authorization guarantee.
- Checked the narrow layout and the desktop composer. At the observed 928px viewport, page width was also 928px (no horizontal page overflow). Corrected narrow-screen balance wrapping.
- Browser console reported no errors or warnings during these checks.

## Still outside this phase

Real cloud authentication, cross-device saving, cloud-backed library authorization, session completion/reset controls, multi-chart replay and full analytics remain subsequent work. Local administrator/public-library workflows are covered by Phase 2 below. Large-data frame-rate testing is not claimed by this pass. The legacy replay engine still pauses on order-level drags; the non-pausing continuous-amendment behaviour belongs to the workspace phase.

## Workspace layout refinement

Moved starting balance, balance, equity, realised P&L, and open P&L into the Performance tab beneath the chart. Removed duplicate account figures from the statistics cards. Added an accessible panel toggle and keyboard tab navigation. Selecting either tab reopens a collapsed panel; the selected tab and collapsed state persist with the session.

Browser verification measured chart height increasing from 503px to 698px when the panel collapsed. Both tabs worked, and the collapsed state survived saving and resuming without changing trades or drawings. Tool-rail, order-ticket, and panel scrollbars now use thin dark styling. No browser console errors or warnings were observed in this refinement pass.

## Phase 2 verification

Verified locally on 11 November 2026. All 55 local checks passed: 21 existing Phase 1 domain/engine checks, 24 dataset-library workflow checks, and 10 offline library component checks. The unchanged production regression suite was not repeated for the library-only changes; its last 109-check pass is recorded above.

Browser checks with the real preview IndexedDB:

- Existing sessions and the private dataset remained available after loading Phase 2. No database reset was performed.
- Created an empty folder and renamed it; the folder remained visible without containing datasets.
- Requested publication of the existing synthetic verification file. The pending copy did not appear in the public catalog.
- Switched explicitly to the local administrator preview. The admin-only requests section showed the uploader’s note, date range, calculation settings and inspectable candle sample.
- Denying without a reason showed validation feedback. Providing a reason recorded the denial and left the original private.
- The trader saw the denial reason and could resubmit. The earlier decision stayed in request history.
- Approval published a separate snapshot. The original remained private and the administrator could review Approved and Denied history.
- A second profile had no access to the uploader’s private dataset or sessions, but could select the approved copy, start a new $50,000 session, and save its own progress.
- Browser console showed no errors or warnings during the verified request/public-session flow.

The component checks additionally exercised direct library upload, dataset settings and validation, upload-to-request flow, save-on-leave skipping, denial feedback, and escaping of untrusted dataset/folder labels. They caught and verified a missing model reference in the standalone upload dialog.

Workflow tests use an atomic in-memory store adapter; actual IndexedDB persistence and review decisions were also exercised in-browser. These are local workflow/privacy checks, not a substitute for cloud authentication/RLS/storage authorization tests. Public data is shared only among local preview identities in this browser. No data was published online, and no Git push, domain change, deployment or production-backend mutation was performed.

# Phases 3–6 verification

Verified locally on 11 November 2026. Production files and backend were not modified; no Git push, deployment or domain change was performed.

## Automated

All **87 local checks** passed:

- 31 parsing, generic-engine, workspace and rewind checks.
- 24 dataset-library rules and 10 dataset-library UI checks.
- 4 practice-time, historical-period and lifecycle rule checks.
- 7 application lifecycle checks through the DOM: Complete, Reactivate, Edit, recoverable Delete/Restore, reset cancellation and reset confirmation.
- 11 analytics and report/drilldown checks.

All **109 original regression checks** also passed: 64 workspace integration, 20 cloud/session, 7 session-store and 18 isolated database checks. Total: **196 passing automated checks**. The hosted database was not used for these tests.

Local HTTP checks returned 200 for the preview and new modules, and 404 for production configuration/auth paths, encoded parent-directory traversal and server source.

## Browser

- Completed a local session and verified read-only review, disabled replay controls and the Mark Active action.
- Reset the dedicated synthetic QA session: zero drawings/trades/orders/positions, replay at candle one, practice time cleared and balance restored to $50,000.
- Opened a synthetic market position, closed it, then rewound. The later realised exit disappeared and the earlier open position was restored.
- Dragged a submitted limit entry while replay continued; the stop/target distances stayed fixed. Dragged a live stop and target during replay; the filled entry stayed at 18400.00.
- Verified the quantity popup changed a draft to two units; potential loss/profit updated immediately to $80/$160 and 0.16%/0.32%.
- Verified 1/2/3-chart layouts, independent secondary timeframes, shared rectangle/label/line style, secondary drawing creation, undo and redo.
- Toggled EMA/VWAP and checked the indicators on the secondary charts. Exercised main and secondary pan, wheel zoom, time jumps and next-day navigation.
- Jumped to 3 March 2026 at 10:00 UTC and changed display to IST; the displayed market time became 15:30 without shifting source timestamps.
- Saved and reloaded the session, restoring the draft, quantity, three charts, indicators, drawings and the lower Performance panel. All three draft handles were visible.
- Dashboard and Reports agreed with the simulated closed trade: $16.50, balance $50,016.50 in its independent $50,000 session. Overall combined two independent sessions without carrying balances. These are synthetic QA trades, not seeded or fabricated report totals.
- Clicked March's calendar result, reviewed the filtered trade and its recorded stop/target/hold time, and checked a per-session report.
- At 928px and 390px viewport widths, outer page width matched the viewport. The mobile iframe also had no page overflow. Restored the normal browser size after checking.
- The existing frame meter reported about 144 FPS at rest and 80–93 FPS during sampled 10× replay intervals with three charts and indicators on 1,560 synthetic candles. Sampled intervals had zero frames over 50 ms, with maximum intervals up to 35 ms. This is a local sample measurement, not a guarantee for large imported files or other devices.
- No new console warnings/errors remained after the final chart observer cleanup fix. Earlier disposed-chart callbacks were caught and fixed by disconnecting observers before removing charts.

## Review artifacts and boundaries

The visible browser preview remains open at http://127.0.0.1:4174/ with a named synthetic QA session and an unsubmitted limit draft ready to drag. Screenshots: preview-workspace.jpg and preview-dashboard.jpg in this directory.

The earlier workflow preview used browser storage and simulated identities/roles. The November 12 verification below supersedes that cloud-integration limitation. Partial exits, additional indicators, commissions/slippage, stop-entry orders and discipline limits remain outside the selected core implementation. Order entry and handles are on the primary chart; secondary charts mirror orders/exits and share drawing edits. Older snapshots without original exit amendments cannot reconstruct information they never stored; new trading activity records checkpoints.

## November 12 — real cloud integration and landing redesign

- Verified existing-account sign-in and server-owned administrator membership through the local app.
- Saved and resumed a synthetic cloud session with a closed $17 trade, restoring its $50,017 balance, replay position and workspace preferences.
- Verified publication denial, resubmission and approval. The approved synthetic dataset has a separate public record; its source remains private. A non-owner RLS check could access the public dataset and asset, but no private sessions or requests.
- Preserved the original MicroBack tables and their two profiles and two sessions. Calibr uses separate additive tables; legacy sessions are not automatically imported.
- All 227 automated checks passed across the original app, Calibr workflows, database isolation, cloud adapter and landing page.
- Visually checked the new dark landing page on desktop and a 390px mobile viewport, including the hand artwork, glass panels, compact mobile layout, reduced-motion handling and the signed-in Sessions CTA. The optimized hero artwork is approximately 164 KB; its source and generation prompt are documented in assets/ART-DIRECTION.md.
- Email-confirmation/password-reset redirect configuration and end-to-end email-link tests remain deferred at the user's request. The pre-existing disabled leaked-password protection warning remains for later Auth settings review.
- Preserved all 10 existing GitHub commits in a local mirror and verified bundle, plus a separate workspace snapshot. See ../backups/README.md.
- Frontend preview remains local at http://127.0.0.1:4174/?page=home. No Git push or Netlify deployment was performed. Authorized additive Supabase schema changes were applied for real cloud verification.

## November 13 — minimal emerald landing and restored application palette

At the user's request, the ivory/botanical redesign was reverted. The original application styles, library styles and report styles were restored byte-for-byte from the pre-redesign source snapshot. The temporary forest theme stylesheet is no longer loaded, and the original Calibr identity and sign-in presentation are restored. Cloud authentication and persistence code remain in place.

The landing follows the latest black/emerald reference with a centered headline, restrained navigation and CTA, and editable SVG flowing ribbons. Neither the hand artwork nor the botanical images are loaded. The abstract artwork is code-native and requires no image download. Desktop and 390px mobile views were checked; mobile content width matched the viewport (375px excluding scrollbar). The landing entry and 32 relevant landing, lifecycle, library UI and analytics checks passed. No Git push or Netlify deployment was performed.

## November 13 — shared black and peach application palette

Applied the landing palette to sign-in, profiles, Sessions, Dashboard, Reports, Datasets and dataset approval screens. Shared tokens in theme.css define black surfaces, warm neutral text, peach accents, selected states, inputs and focus rings. Legacy component literals were recoloured to match; profit/loss and approval status colours retain their semantic meaning. Report curves use peach tones. The wordmark is text-only throughout the account app.

The backtesting iframe, engine, workspace stylesheet and chart settings were not changed. Its parent shell explicitly retains black surfaces. Verified the signed-out sign-in presentation in a separate localhost origin without signing out the user's existing account. Relevant lifecycle, dataset UI, analytics and landing checks all passed (32 checks). No Git push or Netlify deployment was performed.

## Browser-local CSVs, cloud progress — 13 November 2026

New CSV uploads are retained in account/profile/dataset-scoped IndexedDB. Cloud writes contain file identity and session state, with no uploaded candle bodies. SHA-256 matching reattachment is required when local data is missing. New uploads skip the reusable-library/publication flow. Existing cloud datasets remain supported.

All 238 automated checks pass, including local-only cloud payloads, missing cache recovery, mismatched-file rejection, original-file restoration, session-start retries, ownership and revision guards. The static build resolves all 44 local references. A real 180,494-candle NAS100 upload opened successfully in the local signed-in preview; cloud SQL confirmed a 662-byte dataset descriptor, no candle asset, and a saved replay index of 3.

## Stop-entry orders — 13 November 2026

Buy-stop and sell-stop entries use the existing draggable entry/stop-loss/target and quantity controls. Stop triggers are tested against candle highs/lows; gaps execute at the opening price. Drafts never fill. Pending levels stay on their correct trigger side when dragged, and old untyped saved orders remain limits. Stop order types, ticket selection and fractional quantities survive snapshot restoration. Eleven additional regression checks cover these behaviours. OHLC intrabar ambiguity retains the existing conservative stop-loss-first rules.

## On-chart monetary sizing — 13 November 2026

Selected long/short drawings show potential cash profit/loss, account-balance percentages and quantity alongside R:R. Draft, pending and live exit handles use their own quantity and dataset point value. The quantity editor previews both outcomes before Apply, without modifying the pending order during preview. Fractional quantities are supported and synchronize position-box tooltips. Account percentages use the actual session starting balance plus realised results.

Three additional generic-engine tests cover currency/multiplier/fractional sizing, preview-before-apply, independent pending quantities and a profitable live stop. Browser verification confirmed a pending buy stop survives refresh, and sizing from one to five contracts changes the preview and chart from -$40 / +$80 to -$200 / +$400.

## Empty-chart deselection — 14 November 2026

Empty-space primary clicks clear drawing selection after pointer release. Movement beyond three pixels retains selection and pans; simple clicks retain auto-fitting. Cancel, blur and middle-button gestures do not deselect. Pointer-event regression checks cover trend, ray, horizontal/vertical lines, parallel channel, rectangle, Fibonacci, measure, long/short boxes and paths; drawings remain intact and selectable. All 87 core integration checks pass.
