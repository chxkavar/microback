# Calibr deployment

Production site: https://graceful-eclair-84d612.netlify.app/

Repository: https://github.com/chxkavar/microback

Original MicroBack backup: https://github.com/chxkavar/microback-backup (private)

## Build and review

```powershell
npm test
npm run test:build
npm run preview:release
```

Review the static artifact at http://127.0.0.1:4175/. The development preview is at port 4174. These origins have separate browser storage and authentication sessions.

Netlify runs `node build.cjs` and publishes `dist` with no base directory. The build exports Calibr, the pinned Supabase SDK and the same generic replay engine used locally. It requires no application server at runtime. SQL, tests, screenshots, backups and raw imports are excluded. Public datasets use the approved cloud library.

Older `MicroBack.zip` files are historical releases. For a manual Calibr deployment, use the freshly verified `dist` directory.

## Current account policy

The user approved basic email/password accounts for this phase, with **Confirm email temporarily disabled**. New accounts receive a session immediately; email ownership is not verified. Google OAuth, password recovery and custom SMTP are deferred. Use a password specifically for Calibr, not the email account's password.

The Supabase Site URL is configured to the production origin above. Exact confirmation/recovery URLs are allowlisted for the production site, loopback ports 4174/4175 and localhost port 4174. Those email features are not currently exposed in the UI. Before enabling them later, configure production email delivery and test the full flow.

The existing leaked-password-protection warning remains for later review. No service-role key, secret key or database password belongs in the frontend or repository.

## Recovery

The private MicroBack backup repository contains the original 10 commits, ending at `a97a1b958abf281b4925e1ae6107e6cff481fcb3`. A verified local mirror, complete-history bundle and pre-cloud workspace snapshot are also retained under the ignored `backups` directory.

Calibr is released as a descendant of the existing repository history. Do not force-push an unrelated initial commit. A production-branch push can trigger Netlify deployment automatically.

Old MicroBack sessions remain preserved in their original tables and have not been automatically imported into Calibr. See `calibr/CLOUD_SETUP.md` and `calibr/RELEASE-AUDIT.md` for the integration and audit evidence.
