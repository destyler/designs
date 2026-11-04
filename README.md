# Destyler designs · component comparison

A separate design layer for **real, unstyled Destyler UI components**. This repository does not add styles to `destyler/ui` or the underlying state machines.

## Run the unified comparison

```sh
npm ci
npm run build
npm run preview
```

Open the printed URL. The root page compares a **fixed original shadcn/ui reference** on the left with **real Destyler React, Vue, Solid or Svelte** on the right. Switch and Dialog are the two completed style adapters; the page does not offer unimplemented components.

- Changing frameworks only resets the right-hand consumer. The left remains mounted, including its control state and theme.
- Preview and Code replace each other **inside the right-hand panel**. The left remains visible. Returning to Preview preserves its mounted state.
- Each column has an independent light/dark control. The two controls above the comparison can change both together.
- Code is a read-only IDE with filename tabs, exact paths, line numbers and syntax highlighting. Arrow keys/Home/End switch files; the tab strip and editor scroll independently on narrow screens. Preview/Code preserves the selected file.
- Files are the selected framework's actual `Showcase` source, shared data/layout, style definitions, generated package CSS and generated class/theme/token JavaScript exports. Generated files are labelled and downloadable; tracked sources link to GitHub. Code/copy preserves exact file bytes, not simulated snippets or the host page stylesheet.
- Each framework runs in a same-origin iframe to keep framework runtimes and CSS isolated. Its Dialog opens within that canvas, not over the entire host page. Messages verify both origin and source.
- Narrow screens stack the same two panels. Component URLs are `/#switch` and `/#dialog`; browser Back/Forward restores the selected example.

The integrated comparison needs the built consumers, so use `build` + `preview` for the full site. `npm run dev` is the Vite source server for the older React/Vue example at `/examples/shadcn/`; use the individual consumer dev commands in `examples/vanilla-extract/README.md` when editing an adapter.

## Preserved examples

The earlier React/Vue comparison remains at `/examples/shadcn/`, including Checkbox, Tabs and Settings. Its older Tailwind source inspector is separate from the new four-framework style package.

The original style-engine proof remains at `/vanilla-extract/{react,vue,solid,svelte}/`. It compares the precompiled vanilla-extract package with existing Tailwind recipes and exercises theme tokens, explicit overrides and UnoCSS. The unified comparison embeds its dedicated `?showcase=1` mode, which does not load baseline Tailwind CSS.

Nothing is persisted or sent. These are client-rendered examples and not a released component distribution.

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

- This is a runnable vertical slice, **not a complete shadcn port**. The original comparison covers default component variants in React and Vue. The separate Switch/Dialog proof below also covers Solid, Svelte, and SSR/hydration; a general migration CLI is not implemented.
- The example's Tailwind reset is page-wide. Generated theme tokens are scoped to `[data-design="shadcn"]`; this is not yet a distributable zero-global-CSS package.
- Portals receive the owned color mode; arbitrary local CSS-variable overrides are not synchronized by these new adapters. The earlier independent synchronizer remains a separate experiment.
- The production bundle includes two frameworks plus the upstream reference, so it is larger than a single-framework application. The installed Destyler aggregate export also produces an upstream date-package build warning; no date component is used here.
- No npm publication, main-branch merge, UI/core package changes, or user-computer access are part of this example.

## Earlier experiments

The original native-HTML fixture remains at `/examples/native-contract/`; its four-card playground is `/examples/scoped-themes/`. These are explicitly labelled native HTML and are not the new framework integration. The old `src/portal-theme.js` and `styles/themes.css` remain independently testable.

No repository-wide license is assigned here. The owner must select a license for original work before packaging; the upstream and dependency notices remain mandatory. `private: true` prevents accidental npm publication.

## vanilla-extract experiment

A separate Switch/Dialog-only package and standalone React/Vue/Solid/Svelte + UnoCSS consumers now live under [`packages/vanilla-extract`](packages/vanilla-extract/README.md) and [`examples/vanilla-extract`](examples/vanilla-extract/README.md). Run `npm run build` to build the unchanged comparison site plus `/vanilla-extract/react/`, `/vanilla-extract/vue/`, `/vanilla-extract/solid/`, and `/vanilla-extract/svelte/`. The consumers compare the existing Tailwind recipes against precompiled vanilla-extract CSS, without either compiler plugin in their Vite config. They expose independent themes, explicit token overrides, UnoCSS overrides, and body portals.

This is an opt-in proof, not a migration or a published package. [`docs/vanilla-extract-verification.md`](docs/vanilla-extract-verification.md) distinguishes package/SSR/hydration results from actual-browser coverage.
