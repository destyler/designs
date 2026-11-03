# Verification · 2026-11-03

## Deployed code

- Repository: `destyler/designs`, branch `prototype/cloud-scoped-themes`.
- Application commit: `03fff5bf946e3db4c7a20ea0c3a62b8b7cdae880`.
- Vercel project: existing `destyler-designs-prototype` only.
- Deployment: `dpl_BQ1PXKSHV8JDSAqyQAtopqszQeAq`, **READY**.
- Verified live URL: https://destyler-designs-prototype.vercel.app/
- Vercel built the exact application commit using `npm ci` and `npm run build` (about 21 seconds).
- The final verification pass also restricted Tailwind scanning to application and vendored component sources, preventing documentation/test text from changing generated CSS.
- No main-branch merge, npm release, UI/core package changes, or user-computer access.

## Automated cloud checks

- 22 Node source, provenance, comparison-contract and legacy tests: passing.
- JavaScript syntax and TypeScript/Vue checks: passing.
- Production Vite build: passing.
- Production bundle in Happy DOM: repeated React/Vue switching, inactive framework unmount, reference preservation, switch/tab state and inspector expansion pass. Happy DOM is not a browser or visual fidelity test.
- Legacy HTTP route smoke: 8 example/assets routes and metadata protection pass.
- `git diff --check`: passing.
- GitHub reported no check-runs attached to the application commit. The checks above were run in the cloud workspace, not a claimed GitHub CI pass.

## Live cloud-browser checks

The deployed production alias was opened in the supported cloud Chrome browser. Inputs were sent through actual browser controls; computed styles and source text were inspected read-only.

### Comparison and components

- Desktop has exactly two visible panels: official shadcn reference and one Destyler framework. The two panels have equal widths at the inspected desktop viewport.
- React → Vue → React → Vue switching mounts only the selected framework and removes the previous framework's portal owners. The reference's changed switch state survives switching.
- The marketing switch and tips checkbox respond to Space in all three implementations. The dialog reports the changed state (`Marketing: on · Updates: on · Tips: off`).
- Left/Right keyboard navigation selects the appropriate tab. Disabled controls are disabled. Vue's reactive updates are asynchronous; the repeatable test suite now waits for DOM state instead of asserting immediately after input.
- Repeated dialog opening, Done, and Escape close correctly and restore focus to each trigger. Vue was exercised through four close cycles.
- Independent color mode: Vue dark leaves reference light. All dark affects the visible reference and selected framework and is retained when selecting the other framework.
- Dark React and Vue dialogs are body-level portals outside `#app`; background is `oklch(0.141 0.005 285.823)`.
- Visible light Card height was 339 px and radius 14 px in both desktop panels. This is a targeted comparison, not a pixel-diff certification.

### Source inspector

- View CSS / Hide CSS opens, removes, and reopens the inspector.
- Arrow-key navigation and Home move the source-tab selection.
- All seven component recipe filters show only that component's slots and both original and adapted classes.
- Theme-token text matches the actual checked-in token file exactly.
- React and Vue adapter views follow the framework selector and match their actual adapter files exactly.
- Compiled CSS loads successfully from the actual production stylesheet link. Displayed text matches the locally built stylesheet exactly; Download CSS points to that same asset.
- Copy reports successful completion. The cloud browser's separate clipboard inspection API did not return the web clipboard contents, so an independent clipboard round-trip is **not claimed**. The standalone suite includes success/failure coverage but was not run here.

### Narrow viewport

- Opened `/examples/shadcn/responsive.html`, which embeds the same live app in a real 390 px iframe viewport. This is responsive layout verification, not a mobile-device or touch simulation.
- At this viewport the panels stack vertically. The browser reserves 15 px for a scrollbar, leaving a 375 px document content width.
- For React and Vue, all four inspector views have document `scrollWidth = clientWidth = 375`: no page-level horizontal overflow.
- Both frameworks' dialogs fit at width 358 px with 16 px margins in the 390 px viewport, and close through Done.
- Desktop and narrow-viewport screenshots were visually inspected.
- No application-source errors appeared in the inspected console logs. Browser-extension metadata errors were excluded explicitly.

## Limits

Local headless Chromium could not launch: the environment denied IPC socket creation (`Operation not permitted`), including one sandbox-external attempt. Therefore `npm run test:browser` was **not run**. Browser evidence above comes from the live cloud-browser checks, not that standalone suite. No claims of mobile-device, touch, screen-reader, comprehensive accessibility, cross-browser, SSR/hydration or pixel-perfect coverage are made.

This slice covers React and Vue only, default variants of Tabs/Switch/Checkbox/Dialog, plus presentational Card/Button. Solid and Svelte are explicitly not implemented and are not selectable.

The inspector is read-only. Component recipes are Tailwind class strings; the compiled stylesheet includes the page-wide reset and demo layout, not a zero-global standalone distribution. Portals receive their owner's color mode, but arbitrary local variable overrides are not synchronized by these adapters.

Build warnings remain: the published Destyler aggregate export references a non-exported default in its date dependency, and the application chunk exceeds 500 kB (both framework runtimes and the reference are bundled). No date component is used in this slice.
