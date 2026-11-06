# Vue all-component reconstruction

New reconstruction, not a recovered v7 artifact. All 46 examples use published `@destyler-ui/vue@0.0.4` primitives. Derived from the Basic examples in `destyler/ui`, commit `77c065367954fe170ee71f6a6782929fd6ecd6f2`, `packages/vue/src/components`. Internal imports are replaced by public exports. Images use embedded SVGs. Progress starts at 65%; tour starts on user activation. TreeNode is the upstream recursive helper. The non-removable upstream file-upload mock is removed; the live accepted-file list remains.

Validation: `vue-tsc --noEmit -p examples/all-components/vue/tsconfig.json` passed. A Vite SSR registry bundle rendered all 46 examples with `@vue/server-renderer` without browser globals. Client build and DOM interaction validation are recorded by the aggregate reconstruction workflow.

Upstream license follows:

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

## Reproducible simulated-DOM validation

Run `node examples/all-components/vue/verify-ssr-hydration.mjs` from the repository root. It builds production SSR and client bundles, renders all 46 examples in a no-DOM child process, then hydrates in a separate happy-dom process. It asserts retention of SSR elements (including teleported elements), no warnings/errors, and repeated checkbox, dialog, tabs, select, steps, dynamic, tour, and tree interactions. Generated bundles and `report.json` are under ignored `.verification/`. This is simulated-DOM validation, not browser layout, accessibility or visual testing.

Standalone Vite build passed. Vite reports an upstream `@destyler/date` optional default-export warning and the expected large bundle warning.

Calendar explicitly sets table views and matching column counts (day 7, month/year 4), and includes one month/year select pair. Scroll-area thumbs explicitly match their scrollbar orientations. The simulated-DOM verifier checks both examples for unique SSR IDs, calendar day/month/year table semantics and date navigation/selection, and distinct thumb orientations.
