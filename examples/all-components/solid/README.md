# Solid: all 46 component examples

This is a new reconstruction, not recovered v7. The functional starting points are the Basic examples from [destyler/ui](https://github.com/destyler/ui/tree/77c065367954fe170ee71f6a6782929fd6ecd6f2/packages/solid/src/components), release 0.0.4, commit `77c065367954fe170ee71f6a6782929fd6ecd6f2`. They consume the published `@destyler-ui/solid@0.0.4` package on the existing core 0.3.4 baseline.

All 46 families are exported by `registry.ts`. `main.tsx` chooses the `component` query parameter (default `checkbox`), with `theme=light|dark`. SVG illustrations and decorative icons are local. Shared theme styles are supplied by the gallery.

Adaptations: published package paths; local icons/images; an offline restartable guided tour; no required example props; uncontrolled Dialog state so repeated open/close works (upstream Basic hardcoded controlled open). No UI state machine is replaced with native stand-ins. Build and typecheck commands, run at repository root:

- `node node_modules/typescript/bin/tsc --noEmit -p examples/all-components/solid/tsconfig.json`
- `node node_modules/vite/bin/vite.js build --config examples/all-components/solid/vite.config.ts`

## SSR and hydration verification

- `node examples/all-components/solid/verify-ssr.mjs`
- `node examples/all-components/solid/check-hydration.mjs`

The hydration runner builds separate real server and development-enabled client bundles. Each family renders without a DOM, then hydrates the same HTML in a fresh Happy DOM process using Solid's official hydration bootstrap. It checks empty runtime warning/error lists and retention of every meaningful server element. Checkbox, switch, dialog, tabs, select, steps and the named Bold toggle have repeated interaction assertions. The resize separator has an accessible-name assertion; scroll thumb orientations/IDs and all open calendar table IDs have regression assertions. Evidence is saved in ignored `.verification/hydration-results.json`.

Happy DOM does not establish browser layout, pointer geometry, visual appearance, or real focus behavior. Clipboard/file-picker permissions, eyedropper and signature drawing are not exercised. Portal contents that do not exist in server HTML are rendered by the actual client primitive.

## Upstream license

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
