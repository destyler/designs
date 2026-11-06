# CSS-only integration into the five-panel Astro site

Historical integration record. The dependency versions and results below describe the 2026-11-04 candidate. For the later UI 0.0.4/core 0.3.4 upgrade and its separate non-browser checks, see [the 2026-11-06 report](ui-0.0.4-upgrade-verification.md).

Current source layout: [component-local CSS imports](./component-css-import-verification.md) supersede this report's three-tab description. All four frameworks now show the component and distributed CSS, with no separate `styles.ts` entry.

2026-11-04. Integrated the independent CSS-only proof (`96235b5`) with the visual redesign (`32d809d`, cherry-picked locally as `2389647`). This integration was prepared in an independent cloud checkout. No push, deployment, release, UI/core change or user-computer access was performed.

## Actual site changes

- The same five panels remain: original shadcn reference above React, Vue, Solid and Svelte, with independent Preview/Code and theme controls. The visual redesign's layout, colors and IDE treatment are preserved.
- The four current iframes now use `/css-only/{framework}/?showcase=1`, not the vanilla-extract playground. Each renders real published UI beta.21 primitives.
- Each displayed `SwitchExample` and `DialogExample` is the exact file rendered in Preview. These files have no `class`, `className`, style map, theme class or style object. The document canvas is a separate `Showcase` component, also with no classes on primitive parts.
- The three IDE tabs remain. They now display the selected component, the real framework-local `styles.ts` containing one CSS import, and the static package `styles.css`. The stylesheet is accurately labelled distributed CSS, not generated CSS. Copy, download, paths and keyboard controls are retained.
- Each iframe owns its `html[data-theme]`. The existing validated parent-message bridge changes that document theme; its body portals inherit it normally. The CSS package has no theme bridge/runtime. No portal theme class or colorMode prop is needed by the displayed components.
- Documentation canvas typography is set on body, not html, so rem-based primitive sizes remain unchanged. No descendant reset is applied by the canvas.
- Root `build`/`dev` now include the CSS-only consumers. Earlier `/vanilla-extract/`, `/examples/shadcn/` and native experiments remain separately available. Root source copy and README no longer say CSS-only is unimplemented.

The documentation host still uses layout classes, and the original shadcn source keeps its upstream Tailwind classes. Neither is a Destyler consumer styling requirement.

## Passed checks

- Full production build, including Astro, old Vite examples, old four-framework consumers and current CSS-only consumers/reference. The cloud command used `ASTRO_TELEMETRY_DISABLED=1` because the default home telemetry directory is unavailable; no application dependency or permission change was needed.
- 40 unit tests, no failures/skips; JavaScript syntax; `git diff --check`.
- Astro: 14 files, zero errors/warnings/hints. Existing and CSS-only React/Vue/Solid/Svelte type checks pass; Svelte has zero diagnostics.
- Actual four-framework **Showcase** SSR/hydration: 8/8. DOM-free SSR, original node identity, controlled Switch, verified message changes, no style classes, repeated Dialog open/close, hidden state, body portal cleanup, document themes and bridge disposal all pass with zero console errors/warnings.
- Actual production Astro island hydration: all five iframe nodes retained; four independent view/file tab groups; exact source bytes, line counts and clipboard; keyboard controls, unique ARIA IDs, five-way/global themes and repeated component navigation pass. No framework preference is written.
- Astro static output and legacy production Happy DOM tests pass. Eight legacy route/assets HTTP smoke checks pass.
- CSS-only package verification rerun: offline tarball installation, plugin-free bare Vite, zero styling JavaScript, four consumer builds/types from installed CSS, and separately generated UnoCSS override.
- Extended CSS-only fixture SSR/hydration: 8/8, including controlled/uncontrolled Switch, disabled/readOnly, actual UI LocaleProvider RTL, three Dialog cycles and portal cleanup.
- Optional UnoCSS + CSS-only builds pass for all four frameworks; their ordinary configs require no style compiler plugin.

Checked-in evidence: `docs/evidence/css-only-integration-2026-11-04.json`. The earlier package contract/size evidence is in `docs/evidence/css-only-2026-11-04.json`.

## Browser validation still required

This executor cannot launch Chromium: the earlier launch terminated at `socket() failed: Operation not permitted`. No retry or alternate restricted route was used for this integration. The migrated `test:showcase:browser` script and the independent `scripts/test-css-only-browser.mjs` suite are syntax-checked, not claimed as run.

Happy DOM cannot prove layout, actual iframe loading/handshakes, computed CSS, keyboard focus trapping/return, physical input, visual parity or animation. Disabled Happy DOM iframes expose null `contentWindow`; the test records this limitation rather than claiming a real-window handshake. Required browser coverage must be done on an authorized preview before calling the integrated UI visually validated.

The package matches the pinned Switch and Dialog surface tokens. Native anatomy does not identify arbitrary header/footer composition or icon-close variants. The native default uses a regular text close button and does not manufacture extra anatomy. No whole-component pixel-perfect parity claim is made.

The documented package limits remain: importing CSS opts all matching anatomy in that document into the design; local scope themes cannot automatically cross detached portals; layered utilities need intentional layer order; modern CSS support is required; only Switch/Dialog defaults are implemented. The package remains private and unpublished.

## Commands

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm test
npm run check
npm run check:types
npm run check:css-types
ASTRO_TELEMETRY_DISABLED=1 npm run check:astro
npm run test:dom
npm run test:showcase:dom
npm run test:showcase:rendering
npm run test:http
npm run test:css
# Browser-capable authorized preview, still outstanding here:
BASE_URL=https://YOUR-PREVIEW npm run test:showcase:browser
BASE_URL=https://YOUR-PREVIEW node scripts/test-css-only-browser.mjs
```

For an existing checkout already containing visual commit `32d809d`, bring in the CSS-only proof and the integration commit, not a second copy of the visual cherry-pick.
