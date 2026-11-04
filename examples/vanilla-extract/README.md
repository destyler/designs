# React + UnoCSS / Vue + UnoCSS consumers

Each framework has an independent Vite app. The consumer configs use only the framework plugin and UnoCSS. They resolve `@destyler/designs-vanilla-extract-poc` to **precompiled dist**, never the package's TypeScript CSS source. The independent packed-package verification script additionally tests installation without repository aliases.

## Run

From the repository root, first build `packages/vanilla-extract` using its package build command, then:

```sh
node scripts/vanilla-extract-consumers.mjs build
node scripts/vanilla-extract-consumers.mjs dev react --host 127.0.0.1 --port 4181
node scripts/vanilla-extract-consumers.mjs dev vue --host 127.0.0.1 --port 4182
npx vue-tsc --noEmit -p examples/vanilla-extract/tsconfig.json
```

Production output: `dist/vanilla-extract/react/` and `dist/vanilla-extract/vue/`. Relative asset URLs support serving both alongside the existing comparison. Framework navigation links target that combined output; standalone development servers serve only their own framework.

## What to exercise

- Side-by-side vanilla-extract and existing Tailwind recipes, both initially light.
- Independent engine, dark theme, violet token override, and UnoCSS override controls per panel.
- Updates switch starts checked; Small starts unchecked; Disabled starts checked and cannot change. Tab + Space exercises the real published primitive.
- Open dialog: check focus trapping, Escape, close button, Done, and focus return. The body portal receives the theme class **and** explicit token overrides, never relies on scope inheritance.
- UnoCSS override changes the trigger to square corners and 32px horizontal padding. The rule is generated as unlayered CSS, above the package's `destyler` layer.
- `?isolated=1` shows only vanilla-extract and does not request the optional baseline CSS chunk. It disables selecting an unloaded Tailwind engine. This removes runtime baseline CSS, not the shared recipe strings from the JavaScript bundle.

Stable test hooks: `data-panel="react-vanilla|react-tailwind|vue-vanilla|vue-tailwind"`; `data-engine="vanilla|tailwind"`; `data-case="updates|small|disabled"`; `data-action="open-dialog"`; portal `data-portal-owner` and dialog `data-demo-dialog` equal the panel ID.

## Baseline provenance and limits

`shared/styles.ts` imports the existing generated `examples/shadcn/styles/recipes.ts` unchanged. The helper compiles only Switch, Dialog, Label and Button recipe candidates into `shared/baseline.generated.css` with the existing Tailwind compiler. It remaps semantic colors to the same stable `--dy-*` tokens, so this measures CSS engine differences rather than palette differences. The consumer itself has **no Tailwind plugin**.

Tailwind preflight is deliberately excluded from the generated stylesheet. Minimal baseline reset rules apply only under `data-engine="tailwind"` in the lowest `fixture-reset` layer. They cannot restyle vanilla-extract. Unlayered fixture CSS supplies page/panel layout and typography, not Switch/Dialog appearance. It does not impose reduced-motion rules on primitives; the package must handle its own motion preference.

Neither consumer contains vanilla-extract imports or a vanilla-extract plugin. Their aliases target package dist only. The UI uses mounted guards before React body portals / Vue Teleport. That is an SSR-safe implementation pattern, **not a claim that this fixture itself has passed SSR**; see the separate SSR/hydration verification report.

Build warnings from `@destyler/date`'s optional default import and the React barrel bundle size are reported unchanged. Full consumer bundle sizes include the published primitives/framework and comparison UI, and must not be called the styling package's runtime cost.
