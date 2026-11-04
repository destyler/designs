# Astro component-only migration · 2026-11-04

## What changed

- `src/pages/index.astro` and `src/layouts/SiteLayout.astro` own the actual document and static navigation. The interactive comparison is a server-rendered, hydrated React island, not a Vite SPA hidden behind an Astro filename.
- `/reference/` is an Astro page rendering the exact pinned shadcn Switch/Dialog imports. Vendored files and their recorded hashes are unchanged.
- Each current preview shows one Switch, or an Open dialog trigger with a minimal actual modal. Notifications cards, settings rows and status summaries are removed from the new showcase. The old examples remain separately accessible and clearly historical.
- Both sides use isolated same-origin iframe canvases, so both Dialogs stay inside their own canvas. Framework selection only replaces the right iframe. Theme/component updates use validated messages and an explicit ready handshake.
- The right-side Preview/Code tabs and six IDE filename tabs still read the exact adapter, shared helper/canvas, authoring style, generated CSS and generated export bytes.
- The four isolated framework consumers remain Vite-built examples. Astro owns the site, but this change does not convert every historical fixture into an Astro route. The core styling pipeline is unchanged vanilla-extract; CSS-only migration is **not** implemented.

## Executed checks

- `npm test`: all 33 source/contract tests pass, including unchanged vendored bytes, real package imports, component-only source shape, Astro shell ownership and message validation.
- `npm run check`: JavaScript syntax checks pass.
- `npm run check:types`: React/TypeScript, Vue, Solid and Svelte pass; Svelte reports no warnings.
- `npm run check:astro`: 14 files, zero errors, warnings or hints.
- `npm run build`: Astro static generation, preserved Vite examples and all four consumers pass.
- `npm run test:dom`: preserved example interaction smoke and current Astro static HTML assertions pass. The generated root already contains the document shell, heading, both panels and exact source text; `/reference/` already contains a real off-state shadcn Switch before JavaScript.
- `npm run test:showcase:dom`: hydrates the actual built Comparison with Astro’s metadata-selected bundled renderer. SSR nodes, fixed reference frame, framework isolation, Preview/Code state, six exact source files/copy/keyboard tabs, independent themes and component hash changes pass with zero hydration errors. Frame readiness messages are simulated; actual frame navigation is not claimed.
- Astro development HTTP smoke: `/`, `/reference/`, and all four prebuilt consumer routes return 200.
- `npm run test:http`: all eight legacy routes/security checks pass.
- `npm run test:designs:panels`: all eight existing actual Panel SSR/hydration cases pass.
- `npm run test:showcase:rendering`: **all eight actual Showcase SSR/hydration cases pass** for React, Vue, Solid and Svelte. No browser globals are needed during SSR; original server nodes survive hydration. Tests toggle the actual Switch input, reject foreign/invalid messages, change to Dialog, open/close/reopen it, propagate light/dark portal themes, and clean up portals. Zero hydration errors or console warnings. Evidence is generated in `artifacts/astro/rendering/verification.json`.

Happy DOM is not a browser and cannot establish visual fidelity, computed layout, native keyboard navigation, focus traps or touch behavior.

## Browser coverage remains blocked

A production browser regression script is included at `scripts/test-astro-showcase-browser.mjs`, covering both frame handshakes, all four frameworks, real Switch click/Space interaction, Dialog Escape/Close/outside dismissal and focus return, exact code/copy, file-tab keys, state preservation, URL history, independent themes and 1440/390/320 px viewports.

In this execution environment Chromium aborts before visiting a page because its required socket operation is not permitted. Normal and approved elevated execution reach the same restriction. No security configuration was changed and no user computer was used. `artifacts/astro/browser-evidence.json` records this as **blocked**, with no executed browser assertions.

Therefore this report does **not** claim new desktop/narrow screenshots, focus-trap validation, browser visual parity or complete end-to-end browser acceptance. Earlier screenshots in other reports predate this Astro pass. Run the browser script in an allowed browser environment against the final deployment before treating those checks as passed.

## Existing build warnings

The published aggregate React/Vue Destyler exports still emit the pre-existing `@destyler/date` / `@internationalized/date` unused default-export warning, and large-bundle advisories. No date component is used by this showcase. This migration neither suppresses those warnings nor presents them as resolved.
