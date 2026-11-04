# Component documentation experience · 2026-11-04

## References inspected

- Live Destyler UI Switch docs: https://destyler-ui-dev.vercel.app/components/switch/ (HTTP 200). Source reviewed at `destyler/ui` main `f800ab6`, especially `docs/src/components/ComponentPreview.astro`, framework controls and example-source resolution.
- User's exact external reference: https://ui.productdevbook.com/docs?component=accordion and https://ui.productdevbook.com/docs?framework=vue&component=accordion (HTTP 200).
- Its public `docs-C4ob3pJ2.js`, `layout-CB-jRSaw.js`, `loading-Dh9UHU9_.js`, and stylesheet establish the layout and source-loading behavior. Vue uses a real Vue runtime/preview module, with a distinct source-string module for `Accordion.vue`. Its current UI has preview/source side by side, a current-component filename tab, `examples.css`, a disabled future Tailwind tab, and Link/Copy actions.

These are live HTML and public-source inspections, not claims of visual or interactive browser validation. No user computer was used. The existing cloud Chromium launch restriction remains unresolved; no screenshot or browser pass is claimed.

## Latest requested layout

The user's latest instruction replaces the earlier fixed-left/single-framework-right layout:

1. The original shadcn/ui component is first, full width.
2. React, Vue, Solid and Svelte implementations are all present below it, in a two-column desktop grid and a single narrow-screen column.
3. Each framework has its own mutually exclusive Preview/Code controls and filename tabs. Framework selection is no longer needed.

The reference remains mounted while any card switches between preview/code. All five canvases isolate real runtimes and original styling. Vendored shadcn files are unchanged.

## Source corrections

Eight real `SwitchExample`/`DialogExample` files are now imported by the four actual consumers and shown byte-for-byte by the source inspector. A Switch page no longer defaults to a combined Showcase file containing Dialog, bridge events and documentation layout. Dialog works the same way. The three tabs are the selected component, shared authoring styles and generated component CSS; preview plumbing and generated export JavaScript are not first-level source tabs. Every panel has unique tab/panel IDs and scoped keyboard behavior.

Documentation chrome is quieter, code uses 13px text and a larger source viewport, and component navigation resets each editor to the matching actual component file. Framework cards preserve their own view and theme states.

The styling package is still the existing vanilla-extract experiment. No CSS-only/data-attribute migration, UI/core modification, or npm publication is included.

## Verification

Checks and deployment results are recorded after execution below. Happy DOM is not a real browser: it cannot prove layout, computed style, native keyboard focus behavior or pixel fidelity. Host DOM tests simulate iframe readiness messages rather than loading frame apps; the separate four-framework rendering suite executes the actual components' SSR and hydration.

Passed on the final five-panel code:

- `npm test`: all 35 source/contract tests, including exact selected-component source isolation and simultaneous framework panel contracts.
- `npm run check`: JavaScript syntax.
- `npm run check:types`: React/TypeScript, Vue, Solid, Svelte; zero Svelte warnings.
- `ASTRO_TELEMETRY_DISABLED=1 npm run check:astro`: 14 files; zero errors, warnings or hints. Telemetry is disabled only for this invocation because the cloud home config directory is unavailable.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: static Astro site, legacy Vite fixtures and all four framework consumers.
- Static Astro output check: reference first, four implementation cards, five frames, 12 correctly scoped source tabs, unique IDs and exact default component source.
- Production Astro island hydration: all five SSR frame nodes preserved, all four cards independently switch Preview/Code and theme, all 24 component/framework/file combinations match exact source and copy bytes, arrow/Home/End file/view tabs, repeated component navigation preserves iframe identity and mixed view modes, code resets to the selected component, zero console errors/warnings. Frame-ready messages are simulated.
- `npm run test:showcase:rendering`: all eight actual framework SSR/hydration cases pass, including native-input switch changes, validated messages, dialog open/close/reopen, themed body portals and portal cleanup.
- `npm run test:designs:panels`: all eight preserved Panel SSR/hydration cases pass.

The updated `test:showcase:browser` covers the final five-panel layout, actual preview controls, file/copy behavior, keyboard focus, screenshots and narrow viewports. It is **not run** in this pass because the earlier normal and approved elevated Chromium attempts established an environment socket restriction before navigation. The restriction is not bypassed. Visual layout, browser-native focus traps and mobile overflow remain unverified.

Existing package date-export and large-bundle warnings remain; this change does not suppress them or claim to resolve them.
