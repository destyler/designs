Current unified four-framework showcase: see [unified-showcase-verification.md](./unified-showcase-verification.md). The reports below describe earlier versions.

# Verification · 2026-11-04

## Component lab refinement (current)

- Application commit: `665ae50815379d85f58e50cf885834a023166fa5` on `prototype/cloud-scoped-themes`.
- Vercel deployment: `dpl_2RNhG7jEg7tKmhE99AoyL1PWHsBV`, READY, production alias https://destyler-designs-prototype.vercel.app/.
- Remote commit and local Git tree were compared and match. GitHub reports no status checks or check-runs for this commit; the local checks below are not a claim of CI success.
- No main-branch merge, npm release, core/UI package edits, or user-computer access.

### Visual review and iteration

Actual cloud Chrome screenshots of the previous site, shadcn Switch, Radix Themes Switch, and Base UI Switch were inspected before implementation. The first implementation was then inspected at desktop and phone width, not accepted solely because tests passed. A second pass removed a redundant icon block, tightened the title/toolbar spacing, increased source readability and metadata contrast, aligned panel headers, and shortened repetitive status copy.

At the inspected 1180 × 757 desktop viewport, both default comparison panels measure 422.5 px wide and share y=280.90625 to bottom=743.46875. Both inset component cards have the same y=359.90625 and height=318.5625, so the complete default comparison is visible in the first screen. The page has no horizontal overflow.

The same app was inspected in a 390 px iframe, with 375 CSS px content width after the browser scrollbar. The rail becomes a horizontal picker and previews stack. The rendered preview, Vue source and compiled-CSS views have document scrollWidth=clientWidth=375. This is responsive browser testing, not physical-phone or touch emulation.

Screenshots captured: desktop Preview, desktop Code, phone-width Preview, and phone-width compiled CSS. The screenshots were visually inspected and provided to the coordinating assistant for delivery; image files are workspace artifacts rather than runtime assets.

### Actual browser interactions

- Preview and Code are keyboard-operable tabs in the same region. Code hides the preview rather than displaying it above or beside code. The DOM retains two mounted panels; switching back restores the live controls, without scrolling to a separate section.
- Source adapts when React changes to Vue, and focused excerpts are visibly labelled with exact line ranges. Tokens/classes/full CSS remain available.
- Compiled CSS text has SHA-256 `b47019cee1415516af4b4675ad1065f47ce449734d325cb05a84931da525f33c`, matching the actual locally built production asset byte-for-byte. The download target matches the applied stylesheet URL.
- Copy reports success. The browser's separate clipboard inspection API returned an empty string, so an independent clipboard round-trip is **not claimed**.
- React/Vue/React switching leaves exactly two panels. Switches respond to Space; checkbox checked counts change from 2 to 1 in the reference and both frameworks.
- Tabs select Password via ArrowRight in the reference, React and Vue.
- Reference/Vue dialogs close through Escape and Done; the final React dialog also closes with Escape. Focus returns to Review preferences. A dark Vue portal uses the owning dark token (`oklch(14.1% .005 285.823)`).
- Phone-width Vue dialog fits at approximately 358 px with 16 px margins in the 390 px viewport and restores trigger focus after Escape.
- Native browser Back restores Checkbox after Tabs, and Forward restores Tabs.
- Inspected browser error logs contained extension metadata errors, not application-source errors.

### Automated checks

- 24 Node tests pass, including upstream source hashes, recipes, exact source-excerpt ranges, and bounded/lossless syntax coloring.
- JavaScript syntax, TypeScript/Vue, production Vite build, and Happy DOM production smoke pass.
- HTTP routing smoke passes all 8 routes and repository-metadata protection.
- `git diff --check` passes.
- Regression tests now cover Preview/Code exclusivity, preserved mounted state, view-tab and source-tab keyboard operation, close-focus restoration, source bytes, component/hash navigation and framework portal cleanup.

### Limits

Standalone Playwright Chromium cannot launch in this workspace because the runtime denies IPC socket creation. That suite was updated but **not run**. Localhost is not reachable from the separate cloud browser; actual-browser checks above used the deployed public site. Happy DOM does not substitute for these browser checks.

Existing upstream date-export and large-bundle build warnings remain. This remains a React/Vue client-rendered prototype, not a full shadcn port or distributable zero-global stylesheet; Solid/Svelte and SSR are explicitly not implemented. No claim of exhaustive accessibility, cross-browser, touch or pixel-diff certification.

---

## Previous verification (historical)

# Verification · 2026-11-03

## Component-library redesign (latest)

The visual redesign is on the same prototype branch and existing Vercel project. The initial redesign application commit is `4b32ababf546768d16efcf2ed92e7d92ef65a372`; deployment `dpl_AwYMWhpbE5nZBmSDetS6oUsFomnp` reached READY and served the public project URL. Follow-up commits refine the code disclosure, align dialog summaries, and extend tests.

### Research and design

Actual cloud-browser visits and screenshots of the previous site, shadcn home and Switch documentation, Base UI Checkbox, and Radix Themes informed the redesign. See [design references](design-references.md) for exact links and decisions. No brand assets copied.

### Checks rerun for the redesign

- 22 source/provenance/legacy tests, JavaScript syntax, Vue/TypeScript, Vite production build and HTTP routing passed.
- Happy DOM now exercises the focused Switch, Checkbox, Tabs and Dialog examples for both frameworks, state and disabled controls, live counts, three tabs, repeated modal close, open-modal unmount cleanup, hash navigation, and prior Settings behavior.
- The browser below is actual cloud Chrome via its UI tools. The standalone Playwright CLI suite was updated for the new Settings route but was not run in this session.
- GitHub had no status checks or check-runs on the initial redesign commit. Local checks are not a claimed GitHub CI pass.

### Actual browser evidence

- Viewed desktop screenshots of the default Switch page and dark Dialog comparison. The first viewport now shows the component controls, with a library sidebar and compact header instead of the previous large marketing header.
- Repeated React/Vue/React switching left exactly two preview panels mounted.
- Reference, React and Vue switches and checkboxes responded to Space; disabled examples remained disabled.
- Tabs responded to arrow keys and selected Password content in all three implementations.
- Reference and both framework dialogs opened and closed repeatedly with Escape and Done. A phone-width Vue dialog restored focus to its trigger on Escape.
- The source inspector loaded the actual applied CSS and exposed a download link to that same stylesheet. Adapter copying showed success and the clipboard text matched the displayed source.
- A real 390-pixel iframe (375 CSS pixels of content after the browser scrollbar) showed the horizontal component picker and vertically stacked full-width previews. No page-level horizontal overflow with either the preview or compiled CSS open. Vue switch and modal interactions were exercised inside that viewport.

### Limits

- The 390-pixel iframe is responsive browser testing, not physical-phone/touch emulation. No claim of exhaustive cross-browser or assistive-technology testing.
- The cloud browser could not connect to the workspace localhost; visual and interactive checks used the deployed Vercel site. The user’s computer was not accessed.
- The existing large bundle and upstream date-package import warning remain. The build succeeds. Solid/Svelte, SSR and production packaging remain unimplemented and are explicitly disclosed.

## Earlier comparison verification (historical)

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
