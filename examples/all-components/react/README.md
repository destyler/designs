# React all-component reconstruction

This is a **new reconstruction**, not a recovered copy of the missing v7 candidate.
All 46 entries adapt the React Basic examples from the verified Destyler UI 0.0.4 source commit [`77c065367954fe170ee71f6a6782929fd6ecd6f2`](https://github.com/destyler/ui/tree/77c065367954fe170ee71f6a6782929fd6ecd6f2/packages/react/src/components).

- Runtime imports use the published `@destyler-ui/react` 0.0.4 package.
- Internal collection helpers are replaced by published exports.
- The recursive TreeNode helper is copied from the same source.
- Remote images are replaced with a self-contained SVG, and file upload shows genuinely selected files rather than a static mock.
- Dialog uses a client-mounted portal for safe SSR/hydration.
- Scrollbar thumbs explicitly match their parent orientation; the splitter handle is labeled. Calendar uses the public table-ID factory to remove whitespace introduced by the core default ID builder.
- `registry.ts` exposes all 46 examples with no required props.
- `index.html?component=checkbox&theme=dark` selects a family and theme.

From the repository root:

```sh
node_modules/.bin/tsc --noEmit -p examples/all-components/react/tsconfig.json
node_modules/.bin/vite build --config examples/all-components/react/vite.config.ts
node examples/all-components/react/verify.mjs
```

The verification script builds independent server and client bundles. It renders all 46 families without browser globals, then hydrates all 46 in Happy DOM with console warning/error capture and retained server nodes. Checkbox, dialog, tabs, select, steps, dynamic tags, tree, and tour have additional repeated interaction checks. Generated evidence is ignored under `.verification/`.

These are simulated DOM checks, not real-browser, visual, clipboard, picker, download, or accessibility certification. Standalone client builds can emit an upstream `@destyler/date` default-export warning and a bundle-size advisory; neither is hidden or treated as visual verification.

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
