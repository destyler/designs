# Svelte all-component reconstruction

New local reconstruction, not a recovered v7 artifact. Covers all 46 catalog families using actual `@destyler-ui/svelte@0.0.4` primitives (core 0.3.4).

Examples and TreeNode helper adapted from Destyler UI commit `77c065367954fe170ee71f6a6782929fd6ecd6f2`, `packages/svelte/src/lib/components/*/examples/Basic.svelte`, MIT licensed. Published package imports replace source imports. Images use inline SVG, file-upload starts empty for SSR portability, and tour starts on explicit button press. No network assets or dependency changes.

Registry exports `examples`, a family-to-Svelte-component record; components need no props. Standalone entry accepts `?component=checkbox&theme=dark` (defaults: checkbox, light).

## Validation

From repository root:

- `node_modules/.bin/svelte-check --tsconfig examples/all-components/svelte/tsconfig.json`
- `node_modules/.bin/vite build --config examples/all-components/svelte/vite.config.ts`
- `node_modules/.bin/vite build --config examples/all-components/svelte/vite.config.ts --ssr registry.ts --outDir .ssr`
- `node examples/all-components/svelte/check-ssr.mjs`

The SSR configuration externalizes the Svelte server runtime to keep context shared with the renderer. Upstream MIT license is included in `LICENSE.upstream`.

### Actual hydration verification (no browser/server)

Run `node examples/all-components/svelte/verify-hydration.mjs`. This builds independent dev-mode server/client bundles, renders all 46 families without a DOM in a fresh process, then passes the saved HTML to real Svelte `hydrate(..., { recover: false })` in Happy DOM. It verifies retained root anchors and every original primitive DOM node (including relocated portals), and rejects runtime console warnings/errors. It also repeats checkbox/switch toggles, dialog open/close, tabs, select and steps interactions.

Evidence: ignored `.verification/ssr-report.json` and `.verification/client-report.json`. The build can emit upstream bundler warnings, separately from runtime warnings asserted by the tests. This checks DOM behavior only: not browser layout, focus traps, animation, accessibility, canvas rendering, image decoding or downloads.

Regression coverage additionally checks two distinct ScrollArea thumb IDs with parent-matched vertical/horizontal orientations, all three Calendar view table IDs remaining unique after mount/open, and the Splitter's focusable separator accessible name. The splitter example adds `aria-label="Resize A and B panels"` to its resize trigger.

Calendar also supplies the public `Root.ids.table` factory to normalize whitespace in the package-generated view keys to hyphens. Verification rejects whitespace in all SSR and hydrated IDs and verifies unique stable table IDs after opening the calendar.
