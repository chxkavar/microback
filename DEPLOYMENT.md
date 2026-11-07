# MicroBack deployment

Backend project: [MicroBack on Supabase](https://supabase.com/dashboard/project/oodjmefihrhalpffbcye).

The project is in Mumbai (`ap-south-1`). Its database schema and private `mb-datasets` storage bucket have been created. `cloud-config.js` contains only the project's public browser key. No database password, secret key, or service-role key belongs in the frontend or repository.

## GitHub and Netlify

1. Create a private GitHub repository named `microback` and upload the workspace source. Do not upload `.dev-tools` or the ZIP: `.gitignore` excludes them.
2. In the existing Netlify site's build settings, link this GitHub repository. Set the production branch to the branch containing the app.
3. Leave the base directory blank. Build command: `node build.cjs`. Publish directory: `dist`. The build copies only application assets; tests, SQL migrations, and development dependencies stay outside the published site.
4. Deploy and record the exact HTTPS website URL.

For a manual deploy, extract `MicroBack.zip` and deploy the extracted files. The ZIP contains the already built website.

## Authentication URLs

Deployment target: `https://graceful-eclair-84d612.netlify.app/`. Repository: `https://github.com/chxkavar/microback`.

Open [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/oodjmefihrhalpffbcye/auth/url-configuration). Set Site URL to `https://graceful-eclair-84d612.netlify.app` and add `https://graceful-eclair-84d612.netlify.app/` to Redirect URLs. These settings are still pending; they cannot be changed through the connected Supabase tools. The app requests its current HTTP(S) page URL for email confirmations and password recovery. Do not use a `file://` URL.

Email confirmation remains enabled. Test sign-up, the confirmation email, sign-in, password reset, and resume from a second browser. Auth email delivery may require configuring a sender/SMTP provider in Supabase; the default email service has restrictions. Do not weaken confirmation or account isolation to work around delivery problems.

## Application checks

Run `npm ci`, then `npm test`. Tests cover the replay engine, profile/session flow, snapshot restoration, revision conflicts, and Postgres row policies. Chart rendering is stubbed in DOM tests; real pointer interaction and end-to-end email/auth flows still require browser verification.

Cloud saves run about every two seconds while a session changes. A visible Saved to cloud status confirms the server accepted that snapshot. Failed saves show Not saved and prevent leaving through Home or Sign out. A revision conflict pauses replay and offers Reload cloud version; that action explicitly replaces this tab's unsynced state.
