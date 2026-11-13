# Calibr — local frontend, real cloud accounts

A focused trading-practice workspace with a minimal dark landing page, replay charts, independent practice balances and private performance reports.

## Preview

From the project root:

```powershell
node calibr/server.cjs
```

Open **http://127.0.0.1:4174/?page=home** for the landing page or **http://127.0.0.1:4174/** for account entry and sessions. The server binds only to loopback and remains running for local review.

- **Real sign-in:** use your existing MicroBack email/password. Profiles, datasets, sessions and results save in Supabase. Saved to cloud means the server accepted that snapshot.
- **Local demo:** available from the sign-in screen. Its identities and administrator preview are explicitly simulated; data stays in a separate IndexedDB database. Signing into the cloud does not silently upload demo sessions.
- Existing MicroBack sessions and the original live site are preserved. Their automatic conversion into Calibr has not been performed.

The approved release uses basic email/password accounts without email ownership verification for this phase. Password recovery and SMTP are deferred. See **CLOUD_SETUP.md** for backend access rules. The original MicroBack history is preserved in the private **chxkavar/microback-backup** repository and in the local recovery bundle.

## Sessions and datasets

Name a session, add an optional description and choose a starting balance (default $50,000). Upload or select a dataset, review its range/settings, then click **Start session**. Dataset timestamps determine the range; session creation does not require manual start/end dates.

Remember tick size, monetary point value, quantity increment, currency and source timezone with each dataset. Organize private datasets in category folders, starting with MNQ. Saving an uploaded dataset to the reusable library offers an existing or new folder. Private datasets stay associated with their profile; a request is required to publish a fixed copy for other Calibr users.

Cloud publication requests and decisions are enforced server-side. The confirmed administrator account can approve, deny with feedback, and manage public folders. Approval never publishes personal sessions, trades or reports. Synthetic examples and the synthetic QA public dataset are clearly labelled.

Cloud candle assets are immutable JSONB records separate from replay snapshots. Lists load metadata; opening a dataset loads its candles. The current cloud limit is 25 MB of candle JSON per dataset. Larger datasets should be split.

## Lifecycle and practice time

- **Active / Completed:** completion keeps the session read-only until Mark Active is selected. Close open positions and cancel pending orders before completing; the app does not silently liquidate them.
- **Reset:** confirmation clears trades, orders, positions, drawings and practice time; replay returns to the beginning and the original balance is restored in the same session.
- **Rewind:** restore trading state at an earlier candle, discard later activity and recalculate the balance. Drawings remain. Panning the canvas does not rewind replay.
- **Edit / Delete / Restore:** edit the name/description; deletion moves a session to Recently deleted and excludes it from reports. Restore recovers the same data.
- **Timezone:** India is the default. Display labels and report periods follow the selected zone without shifting source timestamps. Existing session-shading and VWAP boundaries retain their UTC conventions.
- **Practice time:** counts focused, visible workspace use; pauses after 60 seconds without input or when switching away. Historical trade duration remains separate.

New activity records trading checkpoints. Older snapshots cannot reconstruct stop/target amendments that were never recorded; missing exits are not invented, and the UI explains how to add them.

## Workspace

Use one, two or three charts with independent secondary timeframes. Replay time, forming candles, drawings and indicator toggles are synced. Draw on any chart. Pan in time and price, wheel-zoom around the pointer, Shift-wheel to pan and Alt-wheel to zoom price. Older revealed history loads on demand.

Replay step is independent from chart timeframe. Step, Back, arrow keys and Play use the selected increment. Next day and Jump to time operate on historical market dates in the chosen timezone. Forward jumps process active orders; rewinds discard future trading activity.

Market and limit orders use dataset-specific prices and quantities. Draft/submitted entry, stop and target handles update continuously while replay runs. Filled entry stays fixed; live exits remain draggable. Edit draft/pending quantity on the chart. Potential loss/profit appears in money, percentage of balance and R:R. The primary chart hosts order controls; secondary charts mirror orders and live exits.

The collapsible lower panel contains Trade history, Performance, Pending Orders and Open Positions. Account figures live in Performance. EMA 20, EMA 50 and VWAP remain available. Drawing colours, styles and labels are editable; long/short boxes always show the central ratio. Profile defaults remember layout, timeframes, indicators and drawing styles.

## Review

Dashboard, Trades and Reports show one session or all independent sessions, filtered by historical dates, timezone and currency. Month/day/week selections drill into their trades. Metrics include P&L, balance growth, win rate, expectancy, profit factor, drawdown, streaks, hold time and realised R when original risk is known.

Overall starting capital is the sum of independent initial balances. Currencies are never mixed without conversion. Date-filtered curves add selected-period realised P&L to that capital. Drawdown uses closed-trade balances, not intratrade equity. Win rates exclude breakeven observations; weeks begin Monday. Practice-time totals cover each selected session's lifetime.

One open position is supported. Partial exits, commissions/slippage, stop-entry orders, new indicators, discipline limits and exports remain outside the selected core implementation.

## Landing page

The landing uses a faint grid, a soft amber spotlight and a slowly moving glow. The account app shares black surfaces and peach accents; the backtesting workspace stays black. Branding is a text-only wordmark. All current landing decoration is CSS, and reduced-motion preferences disable animation. Earlier generated artwork remains in the source assets but is not loaded or included in the release build.

## Static release preview

Run `npm run test:build`, then `npm run preview:release`. Open **http://127.0.0.1:4175/** to test the actual static artifact that Netlify would serve. This uses a separate browser origin from the development preview, so its sign-in and local demo storage are separate. The build exports the same generic replay adaptations used by the development server; it does not require Node on Netlify.

The build publishes only runtime assets. SQL, QA screenshots, backups, fixtures and raw local imports are excluded. See **RELEASE-AUDIT.md** for the current verification and remaining release steps.

## Checks

```powershell
node calibr/verify.cjs
node calibr/verify-library.cjs
node calibr/verify-library-ui.cjs
node calibr/verify-practice.cjs
node calibr/verify-app.cjs
node calibr/verify-analytics.cjs
node calibr/verify-cloud-backend.cjs
node calibr/verify-cloud-client.cjs
node calibr/verify-landing.cjs
npm test
```

Database checks use isolated Postgres/PGlite. Live-backend checks and browser observations are documented in **QA.md**. No credential is requested by the test scripts. The frontend contains only a publishable Supabase key; account authority comes from verified Auth and backend permissions.
