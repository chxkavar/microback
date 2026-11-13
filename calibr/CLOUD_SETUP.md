# Calibr cloud integration — local frontend

The frontend runs at **http://127.0.0.1:4174/**. For the landing-page preview, use **http://127.0.0.1:4174/?page=home**. The approved release uses the existing Netlify site and repository.

## Connected backend

- Supabase project: **MicroBack**, `oodjmefihrhalpffbcye`.
- Real email/password sign-in uses the existing MicroBack Auth accounts. The pinned Supabase JS SDK is served locally from the existing vendor copy. Browser code contains only the publishable key.
- Calibr uses separate `calibr_records`, `calibr_assets` and `calibr_admins` tables. Existing `mb_profiles`, `mb_sessions` and the original dataset bucket are retained unchanged.
- The administrator is the existing, confirmed `chandradevp60@gmail.com` Auth user. Membership is stored in a server-owned table; user metadata and client-side email comparisons cannot grant cloud permissions.
- Existing MicroBack sessions are preserved, but have not been automatically converted into Calibr sessions. Local demo sessions also remain in their separate IndexedDB store; they are not silently uploaded during sign-in.

## Saving and access

Session snapshots, trades, drawings, replay position, workspace settings, balances and practice time persist in Supabase. Autosave changes only the active session. Revision checks reject stale writes. A rejected save stays visibly unsaved; **Reload saved** provides an explicit recovery path. **Sign in again** reconnects without closing the workspace. Expired access tokens are refreshed once before a guarded retry.

Datasets are immutable candle assets in Postgres JSONB, separate from session snapshots. Dataset-list queries return metadata, not candle bodies. Assets are downloaded when needed and cached in memory. The current limit is **25 MB of candle JSON per dataset**; split larger datasets. This implementation does not use a publicly readable Storage bucket.

RLS and restricted transactional RPCs enforce record ownership, profile relationships, immutable dataset references, revision updates and Completed-session restrictions. Browser clients have no direct write grants on the tables. Private datasets are scoped to the profile in the UI; all profiles belong to their authenticated account owner. Sessions and reports never become public when a dataset is approved.

## Public dataset review

Saving a private dataset and requesting public access creates an immutable review snapshot. A denial requires a reason and publishes nothing. Approval creates a separate public dataset record pointing to the immutable candle asset. Public metadata is built from a whitelist and excludes account/profile identity, session state and trades. Duplicate approvals and direct client publication are rejected. Only the verified administrator can manage public folders or decide requests.

The live-backend browser test used **QA · synthetic verification candles**, clearly labelled as 100 synthetic candles. Its original remains private. One denied request and one approved resubmission demonstrate both paths. A separate synthetic cloud session restored its $50,017 balance, closed trade, two-chart layout and EMA after reload.

## Current phase: basic email/password accounts

On 13 November 2026 the user explicitly approved temporarily disabling **Confirm email**. New users can register an email address and Calibr password and immediately receive a session. This does not verify email ownership. Google OAuth, custom SMTP, confirmation emails and password recovery are deferred; the public UI contains no password-reset action. No administrator password-sharing workflow is implemented.

The Supabase Site URL is now **https://graceful-eclair-84d612.netlify.app**. Exact confirmation/recovery callback URLs were added for that production site, loopback ports 4174 and 4175, and localhost port 4174. These are ready for a later email phase; their presence does not mean SMTP is configured.

A disposable live test verified immediate signup, a non-admin role, rejection of an incorrect password, and correct password sign-in after sign-out. The test account was removed afterwards. The existing administrator account and old MicroBack data were not changed. The project still has the pre-existing warning for disabled leaked-password protection.

Before enabling Google or restoring email confirmation later, review account-linking behaviour for identities created without ownership verification. Set up a production mail provider and test confirmation/recovery end to end before exposing those email features.

## Schema and verification

- `cloud-schema.sql`: isolated records/assets, RLS, guarded commits and publication decisions.
- `cloud-local-datasets.sql`: apply after the two base scripts; permits private session-only dataset identity without a cloud candle asset. New CSV bodies are retained in `calibr-local-candles` IndexedDB, scoped by account, profile and dataset. Missing files require SHA-256 matching reattachment.
- `cloud-hardening.sql`: explicit membership read denial and administrator-only public folder management.
- Both scripts were tested on isolated Postgres before being applied through the Supabase connector. The applied migrations are named `calibr_accounts_cloud_records_and_approvals` and `calibr_verified_public_folder_management`.
- Database checks exercise two account identities, direct-write denial, private asset access, forged approvals, immutable public snapshots, stale saves and Completed-session restrictions.
- A live non-owner RLS check confirmed visibility of the one approved public dataset/asset and no private sessions or publication requests. The original two MicroBack profiles and two sessions remained unchanged.

Relevant documentation: [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
