# Precompiled vanilla-extract proof

Experimental **Switch + Dialog only**, derived from the pinned shadcn New York default design. This package is private and not published. It contains style names and CSS, not React/Vue/Solid/Svelte components or state machines. Existing Tailwind examples remain intact.

## Consumer contract

```ts
import { classes, themes, vars } from '@destyler/designs-vanilla-extract-poc'
import '@destyler/designs-vanilla-extract-poc/styles.css'
```

Apply `themes.light` or `themes.dark` to a wrapper. Apply class strings to the matching `@destyler-ui/react`, `@destyler-ui/vue`, `@destyler-ui/solid`, or `@destyler-ui/svelte` primitive parts. `Switch.Control` needs `data-size="default"` or `"sm"`; the normal Destyler data-state/data-disabled/data-focus-visible attributes drive the styles. `Switch.HiddenInput` remains the real focusable input; the example assigns `role="switch"`.

`classes` exposes `switchRoot`, `switchControl`, `switchThumb`, `switchLabel`, `button`, `dialogBackdrop`, `dialogPositioner`, `dialogContent`, `dialogHeader`, `dialogTitle`, `dialogDescription`, `dialogFooter`, and `dialogClose`.

Importing JS is DOM-free and does not import CSS as a side effect, so Node SSR can load it directly. Import CSS explicitly in the application's stylesheet/client entry. The package exports plain ESM, declarations, and an already compiled stylesheet; **consumers do not install vanilla-extract, Tailwind, or their bundler plugins**. Authoring/build tools are dev dependencies of this repository only. CSS is marked side-effectful for bundlers.

## Theme overrides and portals

Public CSS variables: `--dy-background`, `--dy-foreground`, `--dy-primary`, `--dy-primary-foreground`, `--dy-input`, `--dy-ring`, `--dy-border`, `--dy-muted-foreground`, and `--dy-radius`. `vars` exports their `var(...)` references for typed style authoring. Override ordinary CSS variables or use inline style, for example `style={{ '--dy-primary': '#7c3aed' }}` in React with the usual CSSProperties cast.

Body portals and Vue Teleports are outside their owners' DOM ancestry. Pass the **same theme class and explicit token override style** to the portal wrapper. This proof does not inspect and copy arbitrary inherited/computed CSS variables automatically. The consumer adapters show mounted guards so server render never accesses `document`; dialogs start closed on the server. Application code owns its theme state and portal policy.

The CSS uses the named `@layer destyler`, no global reset or element selectors. Ordinary unlayered application CSS and the tested default UnoCSS output override it, regardless of import order. If an application emits utilities into CSS cascade layers, declare its layer order explicitly, e.g. `@layer destyler, utilities;`. Layer support and modern CSS (`oklch`, `color-mix`, individual translate/scale) are required.

## Scope and known differences

- Default Switch size and `sm`, checked/unchecked, disabled, focus-visible. Default Dialog styles, responsive width and open/close keyframes.
- Buttons and text helpers are included only to exercise the dialog, not a complete Button design system.
- Layout is inherited from the consumer; minimal box sizing, border and typography resets are scoped to the exported component classes.
- Reduced-motion timing is explicitly added to vanilla-extract; it is not present in the pinned upstream recipes. Arbitrary slot content remains the consumer's responsibility.
- No automatic custom-variable synchronization, persistence, open-on-server modal proof, or exhaustive assistive technology audit.
- The combined stylesheet contains both components and both themes, so importing a class does not prune unrelated CSS. A per-component publishing strategy is a future decision.
- No repository-wide license has been selected for original work. Upstream shadcn MIT license and notices are retained; publishing remains blocked by `private: true`.

## Build and verify

From repository root: `npm run build:designs`, `npm run test:designs`, then `npm run build:consumers`. See `examples/vanilla-extract/README.md` for runnable React/Vue/Solid/Svelte + UnoCSS consumers and `docs/vanilla-extract-verification.md` for measured results and limits.

The build uses the official vanilla-extract **Rollup** integration with `extract`, not its Vite application plugin (upstream explicitly does not support that plugin for library builds). This creates CSS and JS before consumers build. Declarations are flattened so both TypeScript Bundler and NodeNext resolution work without authoring dependencies.
