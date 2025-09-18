Canonical Navigation Menu

This project now uses a single source-of-truth for the application navigation so the same menu appears on the server-rendered HTML and in client-side enhancements.

Where the menu lives

- Server & build: `src/menu.js` — the canonical menu array used by the server middleware and `/api/menu.json`.
- Client: `public/js/menu-data.js` — attempts to fetch `/api/menu.json` at runtime and falls back to an embedded array for offline/dev.
- Client widget: `public/js/menu-widget.js` — renders the menu into the page by targeting `#app-menu` or an existing `.sidebar`.

How server injection works

- If an HTML page contains the placeholder `<div id="app-menu" class="sidebar"></div>` the Express middleware will replace that placeholder with server-rendered navigation HTML derived from `src/menu.js`. This provides a fully-functional navigation for non-JS users and search engines.
- If a page does not include the placeholder, the existing client-side initializer (`/js/init-shell.js`) is injected as a fallback to normalize and provide toggle behavior.

How to update the menu

1. Edit `src/menu.js` to add/remove/change menu items. Each item is an object: `{ href, text, icon, dataSection? }`.
2. Restart the server to pick up changes (the server requires the module at runtime).
3. The client will automatically fetch `/api/menu.json` and update `window.TSV_MENU` within ~1s; the `menu-widget.js` will re-render on DOMContentLoaded if needed.

Notes & recommendations

- Prefer editing `src/menu.js` only. `public/js/menu-data.js` contains a small embedded fallback for offline development but the canonical menu should be updated in `src/menu.js`.
- Consider extracting `src/menu.js` into a shared JSON file or publishing a build step if you want static clients to get the menu at build time.
- If you want the client to always use the latest menu without reloads, add a small polling or WebSocket update mechanism in `menu-data.js`.

Contact

If you want help migrating the remaining static pages or adding a build-time menu injection step, I can implement that next.
