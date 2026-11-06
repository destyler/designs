# Shared Basic-example theme

`theme.css` is a new plain-CSS reconstruction for the 46 component families in
`catalog.json`, shared by React, Vue, Solid and Svelte. It is **not a recovered
historical v7 stylesheet**, and does not claim pixel-exact shadcn parity.

## Provenance

- Behavior and structural styling reference: verified Destyler UI release source
  at commit `77c065367954fe170ee71f6a6782929fd6ecd6f2`.
- Adapted CSS inputs: `docs/src/styles/components/<family>/basic.css` for every
  family in `catalog.json`. All 46 source files were present.
- Upstream author and license: Elone Hoo, MIT. The complete notice is retained
  below and in the distributed stylesheet header.
- Reconstruction date: 2026-11-06.
- The new palette uses Zinc-like neutral surfaces and contrasting primary
  controls. Original `--demo-coral-*` names remain compatibility aliases; their
  values are neutral. Calendar's original `--sl-color-*` variables are resolved
  locally, without Starlight.

## Integration

Load `theme.css` **inside each isolated example iframe**, not into the outer
gallery. Set `html[data-theme="dark"]` or `html[data-theme="light"]`; light is the
default. Set the body class to `<family>-basic`, and mount the real Basic example
inside `#app` or `#root`; both use the same container rules. Body scoping also styles portaled content outside the mount.

The stylesheet is self-contained plain CSS. It has no imports, external URLs,
font downloads, or required utility/build plugin. A few upstream icons are
inline SVG data URLs. The reconstructed example code replaces remote illustration URLs with embedded
SVGs. QR and clipboard URL values remain sample data, not fetched media. The
stylesheet itself does not change native component behavior.

## Adaptations

- Consolidated all 46 upstream Basic styles, preserving part/state selectors.
- Replaced documentation-wrapper assumptions with `#app`/`#root`-compatible selectors;
  moved wrapper-only dimensions off the body to preserve portal coordinates.
- Added a small iframe reset, local tokens, constrained overlay widths, and
  small-screen adjustments without replacing component positioning logic.
- Kept Carousel's actual Previous/Next/Play/Pause labels visible at all times,
  with separately operable indicators, including for keyboard and touch users.
- Added dialog close-button readability, floating-panel dock/resize affordance,
  dark-mode signature ink and checked-switch-thumb contrast, and scroll-area
  paint adjustments for the upstream examples' inline gray colors.
- Kept QR modules dark on white for scanning. Color-picker values retain their
  actual colors rather than being converted to neutral swatches.
- Added a final native `[hidden]` guard so component display declarations cannot
  expose closed content. `hidden="until-found"` retains its native semantics.
- Added visible keyboard focus, reduced-motion handling, and basic forced-color
  support. These are presentation safeguards, not a full accessibility audit.

## Validation performed

Static validation on the final stylesheet, using existing repository packages:

- PostCSS parsed all 929 rules and 4,005 declarations.
- css-tree reported zero invalid standard declarations; runtime `var()` values
  remain intentionally resolved by the browser/component.
- Lightning CSS compiled/minified without errors or warnings.
- happy-dom parsed every non-keyframe selector.
- All 46 catalog families have a corresponding upstream Basic-style section.
- 184 happy-dom cases verified that hidden root/content/indicator/trigger nodes
  remain `display: none` across all families.
- Two happy-dom cases checked a dialog close button portaled outside `#app`, in
  light and dark modes, for nonzero display/font/opacity.
- All referenced `--demo-*` and `--sl-*` tokens are declared; no external CSS
  imports or external `url()` resources remain.
- Calculated core text contrast ratios: light text 17.72:1, light muted text
  7.73:1, dark text 19.06:1, dark muted text on popover 6.91:1, and primary
  foreground/background 16.97:1. These token checks do not certify all states.

No browser, server, deployment, or remote write was used for this styling task.
DOM and parser checks are not visual/browser interaction verification. Responsive
layout, forced-color rendering, and all native component interactions still
require browser QA of the assembled four-framework gallery.

## Upstream MIT license

MIT License

Copyright (c) 2023-PRESENT Elone Hoo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
