# Calibr

**Replay the market. Refine your execution.**

Calibr is a browser-based trading practice workspace. Bring historical candle data, start an independent practice account, and review the decisions you make. The interface pairs a minimal black-and-peach account area with a focused black chart workspace.

[Open Calibr](https://graceful-eclair-84d612.netlify.app/) · [Source backup](https://github.com/chxkavar/microback-backup)

Early access uses an email address and a Calibr password. Email ownership is not verified in this phase, and password recovery is deferred. Profiles and sessions still use real, private Supabase accounts.

## The core workflow

| Practice | Review |
|---|---|
| Named sessions with a configurable starting balance | Session and overall dashboards |
| Uploaded or saved datasets with remembered calculation settings | P&L, balance growth, win rate and drawdown |
| Market, limit and stop-entry orders with on-chart quantity and exit controls | Historical day, week and month drilldowns |
| One to three synced replay charts and independent timeframes | Private trades and reports for each profile |
| Pan, zoom, drawings, EMA and VWAP | Cloud save/resume and practice-time tracking |

For this phase, uploaded CSV candles stay in browser storage. Only session details, file identity and trading progress save to your cloud account. Resume on the same browser uses the retained candles; if they are missing (including on another device), select the exact original CSV again. Calibr verifies its fingerprint before restoring the session. Keep your original files. New uploads do not enter the dataset library; existing saved datasets remain usable.

Size trades visually: selected position boxes and chart exit handles show potential profit and loss in account currency and as a percentage of current balance. The on-chart quantity editor previews these amounts before applying a size. Stop entries trigger above price for buys and below price for sells; gaps fill at the opening price.

Completed sessions are read-only until reactivated. Reset starts the same session fresh. Rewind removes later trading activity and recalculates the balance.

## Run locally

```powershell
npm ci
node calibr/server.cjs
```

Open [the development preview](http://127.0.0.1:4174/). Existing MicroBack accounts work with the connected Supabase backend. The explicit local demo keeps its data in browser storage.

To preview the actual static release artifact:

```powershell
npm run test:build
npm run preview:release
```

Open [the static release preview](http://127.0.0.1:4175/). Building creates local files in `dist`; it does not deploy anything.

## Verification

```powershell
npm test
npm run test:build
```

The full test command covers the original replay engine, the Calibr app, dataset workflows, performance calculations, cloud adapter and isolated Postgres access policies. The build check verifies the Calibr entry point, local asset references, generic replay adaptations and exclusion of private/development files. Browser observations and release limitations are recorded in [the release audit](calibr/RELEASE-AUDIT.md).

## Scope and current limits

This is a manual OHLC replay simulator. One open position is supported. Stops take precedence when both exits are touched in one candle; OHLC data cannot establish the exact intrabar path. Commissions, slippage and partial exits are not implemented. Drawdown currently uses closed-trade balances. Journaling, notebooks and automated strategy testing are outside the selected scope.

Datasets require at least 20 valid candles. Tick size, monetary point value, quantity increment, currency and source timezone are saved with each dataset. Cloud candle JSON is limited to 25 MB per dataset. Internet access is required for cloud accounts and the chart library.

Email confirmation, SMTP delivery and password recovery are planned for a later phase. Original MicroBack sessions are preserved separately and have not been imported into Calibr. See [deployment notes](DEPLOYMENT.md), [cloud setup](calibr/CLOUD_SETUP.md) and backup verification in [the release audit](calibr/RELEASE-AUDIT.md).

## Source

The Calibr account app and replay integration are in `calibr/`. The underlying replay engine remains in the original `index.html`, `microback.js` and related files. The build adapts that engine into `dist/workspace.html`, keeping the local and static release behaviour aligned.
