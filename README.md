# Destyler designs · component comparison

A separate design layer for **real, unstyled Destyler UI components**. This repository does not add styles to `destyler/ui` or the underlying state machines.

## Run the Astro comparison

```sh
npm ci
npm run build
npm run preview
```

Open the printed URL. Astro 5 owns the document, site navigation and static generation. A server-rendered React island handles the comparison controls. The root page shows the **original shadcn/ui reference at the top**, followed by **four real Destyler implementations: React, Vue, Solid and Svelte**. Switch and Dialog are the two completed style adapters.

- Each canvas shows only the selected component: a single Switch, or an Open dialog trigger and its actual modal. No notification cards, settings forms, or status summaries.
- Desktop implementations use a two-column grid. Narrow screens stack them, with the reference first.
- Each framework card owns its own Preview/Code tabs. Code replaces only that card's preview; the other four previews stay visible. Returning to Preview preserves the mounted component state.
- Each of the five previews has an independent light/dark control. The controls above the reference can change all five together.
- Code defaults to the actual selected `SwitchExample` or `DialogExample` source for that framework. These files are also imported and rendered by Preview. The other component and the iframe bridge are not included.
- Three filename tabs expose the component, shared `styles.css.ts`, and generated `styles.css`. They have syntax highlighting, exact source copying, paths and keyboard navigation. Generated CSS is labelled and downloadable; tracked sources link to GitHub. There are no host-layout or message-bridge tabs.
- Changing the selected component updates all five previews and resets each source to its component file, while preserving each card's Preview/Code selection.
- All five previews use same-origin iframes to isolate their runtimes and CSS. Dialogs open within their own canvas. Messages validate both origin and source.
- Component URLs are `/#switch` and `/#dialog`; browser Back/Forward restores the selected component.

Use `build` + `preview` to run the complete production site, including preserved examples. `npm run dev` prebuilds the design package and four isolated consumers, then starts Astro with hot reload for the host. Consumer files are rebuilt by `npm run build:consumers`; use individual consumer dev commands in `examples/vanilla-extract/README.md` for adapter hot reload. The root `index.html` is only a legacy-server landing page and is not the production entry.

## Preserved examples

The earlier React/Vue comparison remains at `/examples/shadcn/`, including Checkbox, Tabs and Settings. Its older Tailwind source inspector is separate from the new four-framework style package.

The original style-engine proof remains at `/vanilla-extract/{react,vue,solid,svelte}/`. It compares the precompiled vanilla-extract package with existing Tailwind recipes and exercises theme tokens, explicit overrides and UnoCSS. The component documentation embeds its dedicated `?showcase=1` mode, which does not load baseline Tailwind CSS.

Nothing is persisted or sent. Astro statically server-renders the site and original reference; the isolated four-framework consumers hydrate or mount their real primitives in the browser. This is not a released component distribution.

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
npm run check:types      # React/TypeScript, Vue, Solid and Svelte
npm run check:astro      # Astro pages and their React island
npm run build            # Astro static pages, preserved Vite examples, four consumers and notices
npm run test:dom         # Legacy Happy DOM smoke + actual Astro build-time HTML checks
npm run test:showcase:dom # Actual production Astro island hydration and controls
npm run test:showcase:rendering # Actual four-framework Showcase SSR/hydration
npm run test:showcase:browser   # Production Astro host browser regression
npm run test:http        # Legacy static-server routing checks
npm run preview          # Start built site for browser tests
npm run test:browser     # Playwright Chromium; BASE_URL/CHROMIUM_PATH optional
```

The source checks independently assert byte-identical vendor files, deterministic extraction, exact canonical Zinc tokens, allowed selector substitutions and published package imports. Happy DOM is **not a browser or visual fidelity test**. Browser evidence and limits are recorded in `docs/verification.md`. The Astro migration is recorded in `docs/astro-verification.md`; the latest documentation UX and five-panel checks are in `docs/docs-experience-verification.md`. Visual research and redesign decisions are in `docs/design-references.md`.

## Deliberately limited scope

- This is a runnable vertical slice, **not a complete shadcn port**. The original comparison covers default component variants in React and Vue. The separate Switch/Dialog proof below also covers Solid, Svelte, and SSR/hydration; a general migration CLI is not implemented.
- The example's Tailwind reset is page-wide. Generated theme tokens are scoped to `[data-design="shadcn"]`; this is not yet a distributable zero-global-CSS package.
- Portals receive the owned color mode; arbitrary local CSS-variable overrides are not synchronized by these new adapters. The earlier independent synchronizer remains a separate experiment.
- The Astro host and fixed reference use React; each Destyler consumer loads only its selected framework. Legacy examples remain separately built. The installed Destyler aggregate export also produces an upstream date-package build warning; no date component is used here.
- No npm publication, UI/core package changes, or user-computer access are part of this work.
- The core styling implementation is still the existing vanilla-extract proof. The proposed CSS-only styling migration has not been implemented.

## Earlier experiments

The original native-HTML fixture remains at `/examples/native-contract/`; its four-card playground is `/examples/scoped-themes/`. These are explicitly labelled native HTML and are not the new framework integration. The old `src/portal-theme.js` and `styles/themes.css` remain independently testable.

No repository-wide license is assigned here. The owner must select a license for original work before packaging; the upstream and dependency notices remain mandatory. `private: true` prevents accidental npm publication.

## vanilla-extract experiment

A separate Switch/Dialog-only package and standalone React/Vue/Solid/Svelte + UnoCSS consumers now live under [`packages/vanilla-extract`](packages/vanilla-extract/README.md) and [`examples/vanilla-extract`](examples/vanilla-extract/README.md). Run `npm run build` to build the Astro comparison site plus `/vanilla-extract/react/`, `/vanilla-extract/vue/`, `/vanilla-extract/solid/`, and `/vanilla-extract/svelte/`. The consumers compare the existing Tailwind recipes against precompiled vanilla-extract CSS, without either compiler plugin in their Vite config. They expose independent themes, explicit token overrides, UnoCSS overrides, and body portals.

This is an opt-in proof, not a migration or a published package. [`docs/vanilla-extract-verification.md`](docs/vanilla-extract-verification.md) distinguishes package/SSR/hydration results from actual-browser coverage.
