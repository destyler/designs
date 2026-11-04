# Four framework + UnoCSS consumers

React, Vue, Solid and Svelte each have an independent Vite app. These are all four UI frameworks listed in the [current public destyler/ui README](https://github.com/destyler/ui/blob/main/README.md), verified on 2026-11-04 (README blob `b15cbe4bd2246c04efc2f7e61bbe46f93bec3ef7`). This does not imply support for other core adapters. The consumer configs use only the framework plugin and UnoCSS. They resolve `@destyler/designs-vanilla-extract-poc` to **precompiled dist**, never the package's TypeScript CSS source. The independent packed-package verification script additionally tests installation without repository aliases.

## Run

From the repository root, first build `packages/vanilla-extract` using its package build command, then:

```sh
node scripts/vanilla-extract-consumers.mjs build
node scripts/vanilla-extract-consumers.mjs dev react --host 127.0.0.1 --port 4181
node scripts/vanilla-extract-consumers.mjs dev vue --host 127.0.0.1 --port 4182
node scripts/vanilla-extract-consumers.mjs dev solid --host 127.0.0.1 --port 4183
node scripts/vanilla-extract-consumers.mjs dev svelte --host 127.0.0.1 --port 4184
npx vue-tsc --noEmit -p examples/vanilla-extract/tsconfig.json
npx tsc --noEmit -p examples/vanilla-extract/solid/tsconfig.json
npx svelte-check --tsconfig examples/vanilla-extract/svelte/tsconfig.json
```

Production output: `dist/vanilla-extract/{react,vue,solid,svelte}/`. The helper defaults to all four; append a framework name to build one. Relative asset URLs support serving all four alongside the existing comparison. Framework navigation links target that combined output; standalone development servers serve only their own framework.

## What to exercise

- Side-by-side vanilla-extract and existing Tailwind recipes, both initially light.
- Independent engine, dark theme, violet token override, and UnoCSS override controls per panel.
- Updates switch starts checked; Small starts unchecked; Disabled starts checked and cannot change. Tab + Space exercises the real published primitive.
- Open dialog: check focus trapping, Escape, close button, Done, and focus return. The body portal receives the theme class **and** explicit token overrides, never relies on scope inheritance.
- UnoCSS override changes the trigger to square corners and 32px horizontal padding. The rule is generated as unlayered CSS, above the package's `destyler` layer.
- `?isolated=1` shows only vanilla-extract and does not request the optional baseline CSS chunk. It disables selecting an unloaded Tailwind engine. This removes runtime baseline CSS, not the shared recipe strings from the JavaScript bundle.

Stable test hooks: `data-panel="<framework>-vanilla|<framework>-tailwind"` for react/vue/solid/svelte; `data-engine="vanilla|tailwind"`; `data-case="updates|small|disabled"`; `data-action="open-dialog"`; portal `data-portal-owner` and dialog `data-demo-dialog` equal the panel ID.

## Baseline provenance and limits

`shared/styles.ts` imports the existing generated `examples/shadcn/styles/recipes.ts` unchanged. The helper compiles only Switch, Dialog, Label and Button recipe candidates into `shared/baseline.generated.css` with the existing Tailwind compiler. It remaps semantic colors to the same stable `--dy-*` tokens, so this measures CSS engine differences rather than palette differences. The consumer itself has **no Tailwind plugin**.

Tailwind preflight is deliberately excluded from the generated stylesheet. Minimal baseline reset rules apply only under `data-engine="tailwind"` in the lowest `fixture-reset` layer. They cannot restyle vanilla-extract. Unlayered fixture CSS supplies page/panel layout and typography, not Switch/Dialog appearance. It does not impose reduced-motion rules on primitives; the package must handle its own motion preference.

No consumer contains vanilla-extract imports or a vanilla-extract plugin. Their aliases target package dist only. React and Vue import published package roots; Solid and Svelte import the public `/switch` and `/dialog` subpaths. All four use `@destyler-ui/*@0.0.1-beta.21`. The UI uses mounted guards before React body portals, Vue Teleport, Solid Portal, and Svelte bodyPortal action. That is an SSR-safe implementation pattern, **not a claim that this fixture itself has passed SSR**; see the separate SSR/hydration verification report.

Build warnings from `@destyler/date`'s optional default import and the React barrel bundle size are reported unchanged. Full consumer bundle sizes include the published primitives/framework and comparison UI, and must not be called the styling package's runtime cost.

Baseline metadata also records `recipeMapJavascript`, a separately emitted minified ESM export of the same 11 recipe strings, rather than treating serialized JSON as a JavaScript module. Regenerate both with `node scripts/vanilla-extract-consumers.mjs baseline`.
