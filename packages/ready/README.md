# Ready component slice (private experiment)

Three composed controls, four framework adapters, one semantic CSS contract.
Use the explicit framework package subpath and import theme.css once. Wrap consumers in data-rd-theme="default" or "midnight". Components never
branch on theme names. Override the same --rd-* variables for a custom style.

Checkbox accepts label, checked, disabled, name and a boolean change callback.
Select accepts label, options ({label,value,disabled?}), value, placeholder,
disabled, name and a string change callback. Dialog accepts trigger, title,
description, open and a boolean change callback; its body is children/default slot.
Controlled values are optional; absent values use local state. Vue uses update:checked, update:value and update:open events, consumed as
v-model:checked, v-model:value and v-model:open. Hidden form inputs, native disabled handling and primitive ARIA are
retained. No library defaults or published packages change.

Run `node scripts/ready.mjs dev react` (or vue, solid, svelte). Open the URL printed
by Vite. Run `node scripts/ready.mjs build` for four static demos under artifacts/ready.
Serve artifacts/ready with any static server to use the cross-framework links.

## Consuming the private source package

This is a **Vite-compiled source package**, not precompiled JavaScript for direct
Node execution. It intentionally has no default root component export. Select one
framework subpath: `@destyler/ready-prototype/react`, `/vue`, `/solid`, or `/svelte`.
Import `@destyler/ready-prototype/theme.css` once in the application entry.
Use that framework's normal Vite plugin. TypeScript, Vue and Svelte sources remain
in the archive so the consumer compiler handles its own framework semantics.

For a local tarball, run `npm pack ./packages/ready`, then install the resulting
`.tgz` in a Vite application. Install only the matching runtime and UI peer:

- React: `react`, `react-dom`, `@destyler-ui/react@0.0.5`, with `@vitejs/plugin-react`.
- Vue: `vue`, `@destyler-ui/vue@0.0.5`, with `@vitejs/plugin-vue`.
- Solid: `solid-js`, `@destyler-ui/solid@0.0.5`, with `vite-plugin-solid`.
- Svelte: `svelte`, `@destyler-ui/svelte@0.0.5`, with `@sveltejs/vite-plugin-svelte`.

All framework peers are optional at package level so choosing React does not
install Vue, Solid and Svelte. The selected subpath still requires its own listed
peers; optional does not mean its runtime can be omitted. Tested version ranges
and explicit entry points are recorded in package.json. CSS is declared a side
effect so consumer tree-shaking does not discard an intentional stylesheet import.
The `files` list excludes demos, tests, build outputs and dependencies from packing.
No publication is performed by these local packaging commands.

The package consumer regression packs and unpacks the archive into a separate
consumer tree, imports each framework and CSS by package name, builds with its
framework plugin, and checks that unused UI adapters are absent. It reuses the
repository's locked runtime installations, without source aliases or links back
to packages/ready; it is not a claim of compatibility with every bundler.

## Contract

--rd-bg, --rd-surface, --rd-text, --rd-muted, --rd-border, --rd-accent,
--rd-on-accent, --rd-radius, --rd-control-height, --rd-space, --rd-shadow, --rd-font,
--rd-backdrop, --rd-overlay-z.
The default theme is light rounded sans-serif. Midnight changes palette, corner
geometry, spacing, control height, typography and shadow without replacing any
component. Both scopes coexist in each demo with separate component state.

## Deliberate limits

This is not a published library or a replacement for every gallery component.
Inline overlays preserve the nearest theme scope. Do not put scopes in clipped,
transformed or isolated stacking containers; a general portal/theme bridge is not
implemented. Cross-framework API conventions are native, not forced to identical
syntax. Async options, custom rendering, validation recipes, plugin registration,
RTL and nested overlays are not part of this slice. Browser layout, keyboard focus
trapping, real pointer, mobile and assistive-technology acceptance remain pending;
simulated DOM tests are not substitutes for them.

Form submission names are forwarded to hidden controls. Reset uses the primitive's
existing reset listener, not a second business-event listener. Uncontrolled values
return to false/empty; controlled resets request their initial mount values through
the same change callback. Parents may accept the request or keep their current
value. Reset does not unilaterally replace a controlled parent value. A primitive
may suppress notification if the requested value is unchanged.

Hidden Select state and option reset defaults mirror the effective value so native
reset cannot silently submit the first option while the visible value differs.
The primitive separately retains its logical initial reset value. No synthetic
input/change event or duplicate reset callback is added by this reconciliation.
Cancelled resets, repeated/no-op resets, parent acceptance/refusal and FormData
are covered in four-framework simulated tests. Happy DOM's form.reset ordering
is not browser-correct, so cancellation tests explicitly model event-before-default-action ordering.
Successful and repeated reset cases call the actual Happy DOM form.reset() method
on real compiled components and check FormData. These are distinct test layers.
Real-browser form reset and full form-library integration still need validation.

## Verification commands

- `node scripts/verify-ready-clean-consumers.mjs` (opt-in registry access; fresh npm-installed consumers in `/tmp`, four Vite builds and type checks; see [verification report](../../docs/ready-clean-consumer-verification.md))

- `node --test test/ready-*.test.mjs`
- `node node_modules/typescript/bin/tsc -p examples/ready/react/tsconfig.json`
- `node node_modules/typescript/bin/tsc -p examples/ready/solid/tsconfig.json`
- `node node_modules/vue-tsc/bin/vue-tsc.js -p examples/ready/vue/tsconfig.json`
- `node node_modules/svelte-check/bin/svelte-check --tsconfig examples/ready/svelte/tsconfig.json`
- `node scripts/ready.mjs build`

The focused tests exercise real compiled components in simulated DOMs and
check theme contracts. They cover duplicate IDs across scopes, form names,
controlled false/empty values, disabled choices, callbacks, repeated dialog
closing, Escape and title/description links. Both framework pairs are exercised;
Vue/Svelte additionally have explicit frozen-dialog and uncontrolled-mode fixtures.
A Vite HTTP smoke returned 200 for the two-scope React page. No browser screenshot
or pixel-equivalence claim is made.

### Multiple Vue applications on one page

Within one Vue application, framework-generated IDs distinguish component instances.
If a page mounts multiple independent `createApp()` roots, set a different
`app.config.idPrefix` on each app **before** `app.mount(...)`, for example
`app.config.idPrefix = "settings"` and `app.config.idPrefix = "billing"`.
Both the Ready description IDs and the underlying primitive IDs use Vue
`useId()`, whose default prefix is not unique across independent applications.
The two-root demo and regression tests configure distinct prefixes explicitly;
they do not establish support for unconfigured multi-app roots.
