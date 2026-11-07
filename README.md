# MicroBack

A browser-based MNQ futures replay workspace with cloud accounts, profiles, and saved sessions.

## Open

Serve the app over HTTP locally or deploy it to Netlify. Sign in, choose or create a profile, then start a named session or resume one from the library. Cloud sessions save the dataset, replay position, trade history, open positions, pending orders, drawings, indicators, and chart view. Autosave runs about every two seconds; Saved to cloud means that snapshot was accepted by the server.

The Home button pauses and saves the session before returning to its profile's library. Starting a new session requires a name and creates a separate dataset and history. Preview mode is clearly marked and does not save. Internet access is needed for authentication, cloud saves, and the chart library; fonts fall back to system fonts if unavailable.

## Place a limit order

1. Choose Buy / Long or Sell / Short in the right ticket.
2. Set contracts and enable or disable the stop and target.
3. Click **Add limit on chart**.
4. Drag the entry, take-profit, and stop-loss handles, or type exact prices in the ticket. Moving entry moves the exits by the same amount.
5. Click **Place buy limit** or **Place sell limit** to submit. Drafts cannot fill. Submitted orders appear under Pending Orders and can be cancelled.

Submitted limit entry, stop, and target handles remain draggable. Moving a pending entry preserves its stop and target distances. Buy limits stay below the current price; sell limits stay above it. Handles are provided independently for each pending order.

After a fill, drag the live stop and target to amend the open trade. The executed entry price stays fixed. Stops may be moved beyond the entry to protect profit, provided they remain on the appropriate side of the current price. Dragging pauses replay; the amended exits apply to subsequent replay bars.

Buy limits must be below the current replay close; sell limits must be above. Prices use 0.25-point MNQ ticks. Position drawing boxes can populate the ticket using **Use selected position box**.

Long and short drawings display details on hover. Select a drawing with the crosshair to expose editing handles. Use the menu button above the tools to expand their labels.

## Chart navigation and paths

Drag empty chart space with the crosshair to pan horizontally and vertically. Choose **Pan canvas** (the Hand tool) to drag anywhere over the plot without selecting drawings. Middle-button dragging also pans while another drawing tool is active. Drag right to move back through previously revealed candles; older history is loaded as needed. Replay position does not change and future candles stay hidden.

Use the mouse wheel to zoom around the pointer in time and price. Shift-wheel or a horizontal trackpad gesture pans through time. Alt-wheel zooms price only. Navigation turns off automatic fitting; click **Auto** to restore automatic price fitting or **Reset** to fit both axes.

Choose **Path**, click to add vertices, then double-click or press Enter to finish. Escape cancels an unfinished path. Select a completed path to move it or reshape individual vertices. Delete removes the selected drawing.

Trade history and performance appear below the chart. Copy CSV exports all completed trades.

## Hosting

Run `node build.cjs` and publish `dist`. `MicroBack.zip` contains the built site, including account/session scripts and the pinned Supabase browser SDK. The Netlify configuration runs this build automatically. See [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub connection and authentication redirect setup.

For hosted datasets, put CSVs in `imports`. A Netlify Git build regenerates `imports/files.json`; for a manual deployment, update that JSON array yourself. Folder imports require HTTP hosting; local file upload works when opening the HTML directly.

## Verification

Run `npm ci`, then `npm test`. DOM and session checks use jsdom with chart rendering stubbed; database isolation tests run the production migration on isolated Postgres using PGlite. These tests also support the existing `.dev-tools` installation.

Browser visual verification was blocked by the tool's local-file URL policy in the implementation session. The automated checks cover logic and DOM interactions, not chart-library rendering, pixel layout, or native pointer capture.

## Simulation rules

One position is supported at a time. Stops win if both exits are touched in one candle. Gaps through an existing stop execute at the opening price. Limit entries can stop out on their fill candle; targets wait for the next candle unless the entry filled at the open. OHLC data cannot reveal the exact intrabar price path. Commissions and slippage are not modeled. Session shading uses fixed UTC windows.

The original replay engine is in `index.html`; workspace styles and interaction enhancements are in `microback.css` and `microback.js`.
