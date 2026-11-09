# MicroBack workspace verification

Verified on 9 November 2026.

## Results

- `npm test`: 109 checks passed — 64 workspace integration, 20 cloud/session, 7 session-store, and 18 database isolation checks.
- `node build.cjs` and `node verify-build.cjs`: passed. All nine local stylesheet/script references resolve, the pinned auth SDK is included, and development files stay out of the published site.
- Browser checks used disposable preview sessions with synthetic data, without changing saved customer sessions.

## Browser interaction checks

On the 3,900-candle sample, created trend lines, rays, horizontal/vertical lines, parallel channels, rectangles, Fibonacci retracements, measurements, long/short boxes, and a multi-vertex path. Verified persistent position ratios, selection, path reshaping, deletion, undo, and redo with both toolbar and keyboard controls.

Created a draft limit, changed its quantity using a preset and increment button, submitted it, changed the pending quantity to 11, dragged its stop, and cancelled it from the chart. The ticket, chart badge, and pending list stayed synchronized. Filled quantities remain immutable; live stops and targets remain adjustable.

Also checked indicator/session toggles, timeframe switching, replay stepping, and the data-details panel. No console errors appeared during these sample-workspace checks. The optional `?qa=1` frame meter reported representative two-second windows of 128–142 FPS, maximum frame intervals of 14–28 ms, and zero intervals above 50 ms. These are observations from this machine, not a performance guarantee.

## Fixes

- Drawing history now tracks completed creations, moves, vertex edits, selected deletion, and clearing drawings. New edits invalidate redo; session loading clears history. Text fields retain their native undo behavior.
- Rapid second drawing clicks bypass the chart library's double-click recognizer, preventing incomplete two-point drawings. Compatibility-click suppression excludes chart order controls and resets on session load.
- Long/short boxes always show their risk/reward ratio at the entry-line midpoint. Other measurements remain available on hover.
- Draft/pending entry lines expose a quantity editor with input, plus/minus, and 1/5/25/100/500/1,000 presets. Fractional and out-of-range quantities are rejected. Pending orders can be cancelled independently from their chart row.
- Reused order-control DOM rows and cached unchanged drawing hover calculations reduce repeated work during rendering.
- Removed the volume histogram; imported volume remains available for VWAP and data statistics.

## Coverage limits

A synthetic CSV containing 180,000 one-minute candles loaded successfully, and replay reached candle 179,999. The browser automation connection then timed out during pan/zoom and could not reconnect within a bounded retry. Smoothness at that dataset size is therefore **unverified**; the timeout alone does not establish an application defect. Automated navigation checks cover pointer-centered zoom, horizontal/vertical panning, cancellation, and loading older revealed history beyond the initial 6,000-bar window.

Cloud save/restore, conflicts, session editing/deletion, and ownership isolation passed automated checks using fixtures and isolated Postgres. This pass did not use a real user's email authentication or perform a cross-device browser session.
