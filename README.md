# Destyler designs · shadcn source-backed example

A separate design layer for **real, unstyled Destyler UI components**. This repository does not add styles to `destyler/ui` or the underlying state machines.

## Run the example

```sh
npm ci
npm run dev
```

Open the printed local URL. The root page and `/examples/shadcn/` render the same side-by-side comparison:

1. **Reference:** unmodified official shadcn/ui New York v4 components, running on React + Radix.
2. **Destyler React:** published `@destyler-ui/react@0.0.1-beta.21` primitives.
3. **Destyler Vue:** published `@destyler-ui/vue@0.0.1-beta.21` primitives.

Tabs, Switch, Checkbox, and Dialog are real framework components, not handwritten stateful HTML substitutes. Cards and buttons are presentational upstream markup. Each column has independent light/dark state; body-level React portals and Vue Teleports receive their owning column's mode. The example is client-rendered, has no backend and does not persist settings.

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

The source checks independently assert byte-identical vendor files, deterministic extraction, exact canonical Zinc tokens, allowed selector substitutions and published package imports. Happy DOM is **not a browser or visual fidelity test**. Browser evidence and limits are recorded in `docs/verification.md`.

## Deliberately limited scope

- This is a runnable vertical slice, **not a complete shadcn port**. Default component variants only; React and Vue only. Solid, Svelte, SSR/hydration and a general migration CLI are not implemented here.
- The example's Tailwind reset is page-wide. Generated theme tokens are scoped to `[data-design="shadcn"]`; this is not yet a distributable zero-global-CSS package.
- Portals receive the owned color mode; arbitrary local CSS-variable overrides are not synchronized by these new adapters. The earlier independent synchronizer remains a separate experiment.
- The production bundle includes two frameworks plus the upstream reference, so it is larger than a single-framework application. The installed Destyler aggregate export also produces an upstream date-package build warning; no date component is used here.
- No npm publication, main-branch merge, UI/core package changes, or user-computer access are part of this example.

## Earlier experiments

The original native-HTML fixture remains at `/examples/native-contract/`; its four-card playground is `/examples/scoped-themes/`. These are explicitly labelled native HTML and are not the new framework integration. The old `src/portal-theme.js` and `styles/themes.css` remain independently testable.

No repository-wide license is assigned here. The owner must select a license for original work before packaging; the upstream and dependency notices remain mandatory. `private: true` prevents accidental npm publication.
