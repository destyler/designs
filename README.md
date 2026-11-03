# Destyler designs · component comparison

A separate design layer for **real, unstyled Destyler UI components**. This repository does not add styles to `destyler/ui` or the underlying state machines.

## Run the example

```sh
npm ci
npm run dev
```

Open the printed local URL. The root page and `/examples/shadcn/` render the same component library and side-by-side comparison. Choose Switch, Checkbox, Tabs, or Dialog in the sidebar; Settings contains the composed example. The selected example is shareable as `/#switch`, `/#checkbox`, `/#tabs`, `/#dialog`, or `/#settings`:

1. **Reference:** unmodified official shadcn/ui New York v4 components, running on React + Radix.
2. **Destyler:** one real framework at a time. Use the framework selector to switch between published `@destyler-ui/react@0.0.1-beta.21` and `@destyler-ui/vue@0.0.1-beta.21` primitives.

Switching frameworks unmounts the previous demo, including its portals, and resets that demo’s control state. The reference remains mounted. Each framework’s selected light/dark mode is retained for this page session. Only React and Vue are selectable. Changing components resets both examples. Desktop uses a quiet sidebar and two-column preview; narrow screens have a horizontal component picker and stack the same two panels. Back/forward navigation restores the selected component.

Tabs, Switch, Checkbox, and Dialog are real framework components, not handwritten stateful HTML substitutes. Cards and buttons are presentational upstream markup. Each panel has independent light/dark state; body-level React portals and Vue Teleports receive their owning column's mode. The example is client-rendered, has no backend and does not persist settings.

## Inspect the CSS and adapter

Click **View CSS** in the preview toolbar. The preview remains mounted while you inspect its source. The inspector has four views:

- **Theme tokens:** the actual `styles/tokens.css` imported as raw source, with the shared scoped light/dark Zinc variables.
- **Component classes:** original shadcn and adapted Destyler class recipes, filtered by component. These are Tailwind class strings, **not standalone CSS**. React and Vue consume the same `styles/recipes.ts` values.
- **Compiled CSS:** the actual stylesheet fetched from this page’s same-origin stylesheet link. Copy preserves its exact contents, and Download CSS links to that asset. It includes utilities, animations, scoped tokens, the global Tailwind reset, and demo layout. In Vite development, the inspector reads the injected processed styles instead. Loading errors are visible and retryable.
- **React/Vue adapter:** the actual source for the currently selected framework, imported with Vite `?raw`, including real component imports and application of shared recipes.

The inspector is read-only; it does not modify live CSS. The component class filter follows the selected example (Settings defaults to Tabs). Copy uses the browser clipboard API and reports unsupported/denied clipboard access. Apply the classes to the corresponding Destyler parts, include the Tailwind build input in `styles/app.css`, and wrap the component and portal roots in `data-design="shadcn"` (plus `class="dark"` for dark mode). The full page CSS is not a packaged component stylesheet; no claim of zero-global CSS is made.

## Where the design comes from

The source is pinned to shadcn/ui commit `4aaea19d9cff3e0908e12a8c1d504b8c5ec34610` (2026-11-02). `vendor/shadcn/` preserves seven exact component source files, canonical theme definitions and the complete MIT license. `docs/shadcn-sources.json` records source URLs and SHA-256 values.

`npm run sync:shadcn` extracts default-variant class recipes from those files and the exact Zinc token values. React and Vue consume the **same generated recipes**. The reference imports the unmodified source, using build aliases for the upstream utility and button imports.

Adaptation is explicit and limited:

- Tabs: Radix `data-state="active"` → Destyler `data-selected`.
- Checkbox/Switch controls: focus-visible, disabled and invalid pseudo/ARIA selectors → corresponding Destyler data attributes, because the actual focusable input is hidden while the visual control is a separate part.
- Label disabled peers: native `peer-disabled` → `peer-data-[disabled]`.
- Switch hidden inputs explicitly receive `role="switch"`.
- Default size/variant attributes and layout wrappers are supplied by each adapter.

Colors, spacing, typography, borders, radii, shadows and transition values are extracted from the pinned source rather than invented. `public/THIRD_PARTY_NOTICES.txt` is regenerated during builds and shipped with the site.

## Checks

```sh
npm test                 # Source hash/recipe/token contracts and legacy tests
npm run check            # JavaScript syntax
npm run check:types      # TypeScript + Vue
npm run build            # Production Vite bundle and license notices
npm run test:dom         # Run built bundle in Happy DOM; real mount/state smoke
npm run test:http        # Legacy static-server routing checks
npm run preview          # Start built site for browser tests
npm run test:browser     # Playwright Chromium; BASE_URL/CHROMIUM_PATH optional
```

The source checks independently assert byte-identical vendor files, deterministic extraction, exact canonical Zinc tokens, allowed selector substitutions and published package imports. Happy DOM is **not a browser or visual fidelity test**. Browser evidence and limits are recorded in `docs/verification.md`. Visual research and redesign decisions are in `docs/design-references.md`.

## Deliberately limited scope

- This is a runnable vertical slice, **not a complete shadcn port**. Default component variants only; React and Vue only. Solid, Svelte, SSR/hydration and a general migration CLI are not implemented here.
- The example's Tailwind reset is page-wide. Generated theme tokens are scoped to `[data-design="shadcn"]`; this is not yet a distributable zero-global-CSS package.
- Portals receive the owned color mode; arbitrary local CSS-variable overrides are not synchronized by these new adapters. The earlier independent synchronizer remains a separate experiment.
- The production bundle includes two frameworks plus the upstream reference, so it is larger than a single-framework application. The installed Destyler aggregate export also produces an upstream date-package build warning; no date component is used here.
- No npm publication, main-branch merge, UI/core package changes, or user-computer access are part of this example.

## Earlier experiments

The original native-HTML fixture remains at `/examples/native-contract/`; its four-card playground is `/examples/scoped-themes/`. These are explicitly labelled native HTML and are not the new framework integration. The old `src/portal-theme.js` and `styles/themes.css` remain independently testable.

No repository-wide license is assigned here. The owner must select a license for original work before packaging; the upstream and dependency notices remain mandatory. `private: true` prevents accidental npm publication.
