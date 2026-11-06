# CSS-only Switch/Dialog proof verification

Historical proof record. The beta.21 results below are not new-version acceptance. The [2026-11-06 upgrade report](ui-0.0.4-upgrade-verification.md) records the separate UI 0.0.4/core 0.3.4 checks.

This records the initial independent proof. The subsequent Astro integration is documented in [css-only-integration-verification.md](css-only-integration-verification.md).

Verified 2026-11-04 in an independent cloud checkout based on `b1e7b3f`. No UI headless code, existing showcase files, main branch, or deployment was changed. The production site is **not migrated by this commit**.

## Deliverable

- `packages/css-only/styles.css`: CSS attribute selectors over native Switch and Dialog anatomy, with zero-specificity selectors in `@layer destyler`. No design JavaScript, generated classes or package dependencies.
- `examples/css-only/{react,vue,solid,svelte}`: actual published UI beta.21 consumers with only the framework compiler and a normal CSS import. Source components contain no `class`/`className` bindings or style objects.
- `examples/css-only/reference`: pinned original shadcn components on a separate reference page, unchanged upstream sources.
- Independent package/build, SSR/hydration, UnoCSS compatibility and browser verification scripts.

## Passed

- All 39 repository unit tests, no skips, after building the existing vanilla-extract package.
- Existing repository JavaScript syntax and four-framework type checks.
- New four-framework type checks, including Svelte with zero diagnostics.
- CSS syntax parse; native anatomy/theme selector boundaries; no global reset, generated classes or styling imports in component source.
- `npm pack`, offline install in a clean temporary consumer, bare Vite build with no plugins. The CSS import emits **0 bytes of styling JavaScript**. Package has zero runtime/peer dependencies and contains no JavaScript.
- Production builds of all four real consumers using **CSS from the installed tarball**, plus the pinned shadcn reference build.
- Optional UnoCSS + CSS-only package builds for all four frameworks. Normal consumer configs do not include UnoCSS; the compatibility harness injects it separately.
- Eight actual-component SSR/hydration cases: four server renders with no DOM and four client hydrations retaining the original controls/trigger. Controlled and uncontrolled state, disabled/readOnly preservation, native RTL attributes from LocaleProvider, three Dialog open/close cycles, hidden state, body portals and cleanup all pass. No console warnings/errors or styling classes.

Raw package CSS: 7,420 bytes; gzip: 1,878 bytes. Lightning CSS minified: 5,863 bytes; gzip: 1,450 bytes. These are the style artifact only, not framework/UI/application bundle costs. See the checked-in evidence JSON for exact measurements and package integrity.

## Not verified in a real browser here

The Playwright executable bundled with this workspace is absent. Installed system Chromium starts but terminates at `socket() failed: Operation not permitted`; it also reports a read-only Crash Reports path. No alternate restricted execution route was used after that failure.

The complete browser suite is present and syntax-checked, but **not run successfully**. Therefore computed-style/pixel parity, keyboard focus-visible, focus trapping/return, outside-click dismissal, nested token rendering, UnoCSS effective cascade, RTL geometry, mobile layout and reduced-motion appearance are not claimed as passed. happy-dom does not establish any of those. A browser-capable authorized preview must run the suite before a visual parity claim or production migration.

## Scope and explicit limitations

1. Default import styles every matching Switch/Dialog anatomy in its document. Other native elements/scopes are not selected. Isolation of identical anatomy with different designs needs a separate document or a future explicit scope API.
2. Global `html[data-theme]` and public tokens naturally reach body portals. A local trigger ancestor's theme cannot cross into a detached body portal using CSS alone. Applications with local themes must mirror their scope on the existing portal container or mount inside the scope. No runtime syncing is hidden in the package.
3. A native CloseTrigger has no icon-vs-footer meaning. It is styled as a regular button; the proof does not guess from text, `aria-label` or DOM position. Header/footer composition is not supplied by native UI anatomy.
4. Optional Switch `data-size="sm"` is a design variant, not UI-generated state. RTL uses the supported UI LocaleProvider; passing `dir` to Switch.Root alone does not set the service direction in beta.21.
5. `:where`/cascade layers let unlayered app utilities override styles. Layered utilities must be ordered intentionally. No `!important` or page-wide reset is introduced.
6. Modern CSS features (`light-dark`, `color-mix`, OKLCH, layers, translate/scale) are required. Derived colors are evaluated at the primitive so descendant token overrides remain live.
7. The primitive still owns behavior, accessibility, hidden-input and positioner inline styles, portal construction and SSR lifecycle. This is zero **styling-package** JavaScript, not zero UI/framework JavaScript.
8. Declared exit keyframes do not prove observable exit transitions. Native hidden state remains authoritative, and presence/unmount behavior determines timing.
9. Only Switch/Dialog defaults and their supporting primary button appearance are covered, not all components or shadcn variants. This private package is not published.

Existing build warnings: the published React/Vue barrel imports produce an optional `@destyler/date` default-export warning; the React consumer has a large bundle warning. Neither is counted as style runtime cost, and neither was fixed by changing headless UI.

## Reproduce

```sh
npm run build:designs
npm test
npm run check
npm run check:types
node scripts/verify-css-only.mjs
node scripts/verify-css-only-ssr.mjs
node scripts/verify-css-only-unocss.mjs
BASE_URL=https://YOUR-AUTHORIZED-PREVIEW CHROMIUM_PATH=/path/to/chromium node scripts/test-css-only-browser.mjs
```

The final command is a future required browser check, not a result from this executor. Ordinary site build/deploy is intentionally left unchanged.
