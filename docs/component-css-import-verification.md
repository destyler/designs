# Component-local CSS imports

Verified locally on 2026-11-04 from baseline `4ff0216059016905ae049403f4a3289747e04d37`. No push or deployment was performed. This change does not include the separate navigation-arrow fix.

## Change

- React, Vue, Solid and Svelte now import `@destyler/designs-css-only-poc/styles.css` inside each actual `Example`, `SwitchExample` and `DialogExample` source file.
- Removed the four one-line `styles.ts` files and their application-entry imports.
- Every source inspector has exactly two tabs: the actual component and distributed `styles.css`. Copying the component includes its CSS import. Source paths, exact-byte copying, line numbers and keyboard navigation remain covered.
- The stylesheet, native primitive markup and portal behavior are unchanged. The import remains global static CSS, not framework-scoped styling. Separate preview documents still provide isolation. Multiple component imports resolve to one emitted package layer per framework build.

## Passed checks

- Full production build, including Astro, all four CSS-only consumers, the reference and legacy consumers.
- All 40 unit tests, JavaScript syntax checks, framework type checks and Astro diagnostics.
- Packed CSS installed offline into a separate consumer; zero-plugin bare Vite proof emits no styling JavaScript. All four framework builds use the packed CSS and emit its `destyler` layer once.
- All four combined UnoCSS builds.
- Bare component fixture SSR/hydration: 8/8 cases. Server nodes are reused; controlled, disabled, readonly and RTL cases work; each portal opens/closes three times and is removed on unmount.
- Actual Showcase SSR/hydration: 8/8 cases. Each renders the displayed component without browser globals, switches between Switch and Dialog, updates document themes and cleans up portals/listeners.
- Production Astro static output and island hydration: four two-tab source inspectors, exact displayed source and clipboard bytes, keyboard wrapping/Home/End, component navigation, independent themes and stable iframe nodes.

Machine-readable results are in [the verification summary](./evidence/component-css-imports-2026-11-04.json).

## Browser limitation

The updated Chromium browser suite could not start in this execution environment. Both normal and elevated local launches exited before any page loaded with `process_singleton_posix.cc: socket() failed: Operation not permitted`. Browser assertions, screenshots and visual parity for this change are therefore **not verified**. The DOM checks above do not substitute for browser rendering, real focus behavior or viewport checks. The browser suite has been updated for two tabs and can be rerun against a local production build in an environment that supports Chromium sockets.
