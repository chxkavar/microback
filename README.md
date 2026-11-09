# MicroBack

**Replay the market. Practice your setups. Pick up where you left off.**

MicroBack is a manual backtesting workspace for Micro E-mini Nasdaq-100 (MNQ) futures. Import historical candles, replay price action one bar at a time, and practice trade execution directly on the chart. Profiles and cloud sessions keep your research, drawings, and trade history together across devices.

[**Open MicroBack →**](https://graceful-eclair-84d612.netlify.app/) · [Deployment guide](DEPLOYMENT.md) · [Report an issue](https://github.com/chxkavar/microback/issues)

## Features

| Feature | What you can do |
|---|---|
| **Market replay** | Step forward or back, control playback speed, and choose a date range. Future candles stay hidden. |
| **Interactive charts** | Pan through historical price action and zoom around the pointer. Switch between 1m, 3m, 5m, 15m, 30m, 1h, and 4h views. |
| **On-chart execution** | Place simulated market or limit orders. Drag pending entries, stops, and targets to adjust your setup. |
| **Drawing tools** | Mark up charts with trend lines, rays, channels, rectangles, Fibonacci retracements, paths, and long/short position boxes. |
| **Indicators and sessions** | Add EMA 20, EMA 50, VWAP, and Asia, London, or New York session shading. |
| **Profiles and saved sessions** | Create named sessions, resume your progress, rename sessions, or delete them with confirmation. |
| **Performance review** | Review trade history, P&L, win rate, profit factor, and drawdown. Copy completed trades as CSV. |

## Start a session

1. [Open MicroBack](https://graceful-eclair-84d612.netlify.app/) and sign in or create an account.
2. Choose a profile, or create one for your practice.
3. Select **New session**, give it a name, and upload a CSV or choose an available dataset.
4. Replay the market, annotate your setup, and place simulated trades.

Want to try the interface first? Choose **Preview the workspace** and start with sample data. Preview sessions are not saved.

### Continue where you left off

Cloud sessions save your dataset, replay position, trades, open position, pending orders, drawings, indicators, and chart view. Autosave runs approximately every two seconds when changes are detected. **Saved to cloud** confirms that the server accepted the latest snapshot.

The **Home** button pauses replay and saves your work before returning to the session library. From there, you can resume a session, rename it with **Edit session**, or remove it with **Delete session**.

## Trade directly on the chart

For a limit setup:

1. Choose **Buy / Long** or **Sell / Short** in the order ticket.
2. Set the contract quantity and configure your stop loss and take profit.
3. Select **Add limit on chart**.
4. Drag the entry, stop, and target handles, or enter exact prices in the ticket.
5. Select **Place buy limit** or **Place sell limit** to submit the order.

Click the contract-count badge on a draft or pending entry line to change quantity. The editor provides a whole-contract input, plus/minus controls, and presets from 1 to 1,000. Apply updates the order and ticket together. Filled quantities stay fixed.

Draft orders cannot fill. Once submitted, a pending order's levels remain draggable. Moving its entry preserves the stop and target distances. Buy limits must stay below the current price; sell limits must stay above it.

After a fill, the executed entry price stays fixed. You can continue dragging the live stop and target to adjust the open trade. Dragging a level pauses replay, and the changes apply to subsequent replay bars.

You can also select a long or short position drawing and choose **Use selected position box** to populate the ticket.

## Chart controls

| Action | Control |
|---|---|
| Pan the chart | Drag empty chart space with Crosshair, or use **Pan canvas** to drag over drawings. |
| Pan while drawing | Hold the middle mouse button and drag. |
| Zoom around a location | Move the pointer there and scroll. |
| Scroll through time | Hold **Shift** and scroll, or use a horizontal trackpad gesture. |
| Zoom price only | Hold **Alt** and scroll. |
| Restore the view | Select **Auto** for automatic price fitting or **Reset** to fit both axes. |
| Edit a drawing | Select it with Crosshair, then drag its body or handles. |
| Finish a path | Double-click or press **Enter**. Press **Escape** to cancel an unfinished path. |

Expand the left toolbar to see tool names. Long and short position drawings always show risk/reward at the entry line; detailed measurements appear on hover. Use the toolbar Undo/Redo buttons, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, or Ctrl+Y to reverse drawing creation, reshaping, movement, and deletion. Drawing history resets when a session is loaded.

The chart displays candles without a volume histogram. Imported volume remains available to VWAP and the data-details panel.

## Import your data

Supply **1-minute OHLC data** with at least **20 valid bars**. Column names are case-insensitive; comma, semicolon, and tab separators are supported. Volume is optional.

### Timestamp format

```csv
time,open,high,low,close,volume
2026-03-02T09:30:00Z,18450.25,18462.50,18448.00,18458.75,420
2026-03-02T09:31:00Z,18458.75,18465.00,18455.25,18461.50,365
```

The time column may also be named `timestamp`, `datetime`, or `date`. ISO timestamps and Unix timestamps in seconds or milliseconds are accepted.

### Session-and-bar format

```csv
session,bar,open,high,low,close
2026-03-02,0,18450.25,18462.50,18448.00,18458.75
2026-03-02,1,18458.75,18465.00,18455.25,18461.50
```

Session dates accept `YYYY-MM-DD` or `DD-MM-YYYY`. Bar `0` maps to 09:30, with each subsequent bar advancing one minute. This format uses the supplied clock times without timezone conversion.

The examples above show the structure; a complete upload needs at least 20 valid bars. Imported rows are sorted, duplicate timestamps are removed, and invalid candles are skipped.

## Run locally

Use **Node.js 22.13+ within the 22.x series, or Node.js 24+**, and npm.

```bash
git clone https://github.com/chxkavar/microback.git
cd microback
npm ci
npm run build
```

Serve the generated `dist/` directory over HTTP. For example, if Python 3 is installed:

```bash
python -m http.server 3000 --directory dist
```

Then open [http://localhost:3000](http://localhost:3000).

For your own deployment, configure a Supabase project in `cloud-config.js`, apply the SQL migrations in `supabase/migrations/`, and configure the allowed authentication redirect URLs. The browser configuration must use a **publishable key**; secret and service-role keys do not belong in frontend code.

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details. Internet access is required for cloud features and the chart library.

## Development

MicroBack uses plain HTML, CSS, and JavaScript, [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) for charting, and Supabase for authentication, Postgres, and private dataset storage. Netlify hosts the static build.

| Path | Purpose |
|---|---|
| `index.html` | Application shell, chart setup, and replay engine |
| `microback.js` / `microback.css` | Chart interaction, drawing tools, and workspace layout |
| `workspace-tools.js` / `workspace-tools.css` | Drawing undo/redo and on-chart order quantity controls |
| `accounts.js` / `accounts.css` | Sign-in, profiles, and session-library interface |
| `cloud-store.js` | Cloud session and dataset operations |
| `session-state.js` | Capture and restoration of replay state |
| `supabase/migrations/` | Database schema and access policies |
| `build.cjs` / `netlify.toml` | Static build and deployment configuration |

### Checks

```bash
npm test
npm run build
node verify-build.cjs
```

The tests cover replay behavior, order handling, session restoration, edit/delete flows, revision conflicts, and database access isolation. DOM tests stub chart rendering; visual layout, native pointer gestures, and email authentication flows also require browser testing.

## Simulation model

MicroBack is a practice simulator with a defined execution model:

- One open position is supported at a time.
- P&L uses $2 per point per MNQ contract, with prices in 0.25-point ticks.
- Stops take priority when a candle touches both stop and target.
- Gaps through an existing stop execute at the opening price.
- Limit entries can stop out on their fill candle. Targets wait until the next candle unless entry filled at the open.
- Commissions and slippage are not modeled. OHLC candles cannot reveal the exact intrabar price path.
- Chart timestamps are displayed as UTC. Session shading uses fixed UTC windows without daylight-saving adjustments.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/chxkavar/microback/issues) with the steps to reproduce it, your browser version, and the data format involved.

