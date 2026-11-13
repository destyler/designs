# Ready component slice (private experiment)

Three composed controls, four framework adapters, one semantic CSS contract.
Use the explicit framework package subpath and import theme.css once. Wrap consumers in data-rd-theme="default" or "midnight". Components never
branch on theme names. Override the same --rd-* variables for a custom style.

Checkbox accepts label, checked, disabled, required, error, name and a boolean change callback.
Select accepts label, options ({label,value,disabled?}), value, placeholder,
disabled, required, error, name and a string change callback. Dialog accepts trigger, title,
description, open and a boolean change callback; its body is children/default slot.
Controlled values are optional; absent values use local state. Vue uses update:checked, update:value and update:open events, consumed as
v-model:checked, v-model:value and v-model:open. Hidden form inputs, native disabled handling and primitive ARIA are
retained. No library defaults or published packages change.

Run `node scripts/ready.mjs dev react` (or vue, solid, svelte). Open the URL printed
by Vite. Run `node scripts/ready.mjs build` for four static demos under artifacts/ready.
Serve artifacts/ready with any static server to use the cross-framework links.

## Consuming the private source package

For the complete checkout → tarball → clean Vite application commands and minimal
React/Vue/Solid/Svelte source, follow the [executable quickstart](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-quickstart.md).
The quickstart generator lives in the repository, not inside this tarball.
For built-in and custom theme usage, read [THEMING.md](./THEMING.md).

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
syntax. Async fetching/loading lifecycles, custom rendering, validation recipes, plugin registration,
RTL, general nested-overlay behavior and multiple-modal stacks are not promised
by this slice. A Select inside a Dialog has limited simulated-DOM regression
coverage: Escape closes the Select before the Dialog, with focus restoration and
cleanup checks. That does not establish arbitrary nesting support or real-browser
acceptance. Browser layout, keyboard focus trapping, real pointer, mobile and
assistive-technology acceptance remain pending;
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

These commands run from a checkout of the **repository root** with its dependencies
installed (`npm ci`). They are not scripts shipped inside the packed package.

- `node scripts/verify-ready-clean-consumers.mjs --documented` (installs and builds the exact quickstart examples)

- `node scripts/verify-ready-clean-consumers.mjs` (opt-in registry access; fresh npm-installed consumers in `/tmp`, four Vite builds and type checks; see [verification report](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-clean-consumer-verification.md))

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

## Select option values

An option's `value` must be a unique, nonempty string. Exactly `""` is reserved for no
selection and the clear callback, so an empty option throws a descriptive runtime
error before creating the collection, even when disabled. The same validation
runs when options change. Values are never trimmed or silently filtered: `"0"`,
`" "` and all other nonempty strings remain valid. TypeScript's `string` type
cannot prove nonempty values or uniqueness across an array; runtime validation is authoritative.

Duplicate values throw a descriptive Ready error before collection creation,
including duplicates with identical labels or disabled entries. Validation also
runs on reactive option replacements. Values are compared exactly, without
trimming or case folding: `a`, `A`, ` a` and `a ` are distinct. Repeated labels
with distinct values are allowed. No first/last-wins deduplication is performed;
applications must provide stable unique keys rather than rely on labels or array
positions. Every option also needs a non-whitespace `label`, including disabled
options. Empty or whitespace-only labels throw a Ready error during initial
rendering (including SSR) and reactive option replacements. Valid labels retain
their original whitespace; equal nonblank labels with distinct keys are allowed. Handle invalid external data before rendering; this developer error
is not a form validation message or an automatic recovery mechanism.

## Server rendering and hydration

The Vite source-package contract does not by itself guarantee SSR integration.
See the [SSR and hydration verification](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-ssr-hydration.md)
for the tested server/client compilation paths, form-state fixes and limits.
These checks use real server rendering followed by simulated DOM hydration, not
browser acceptance or a promise of Next.js, Nuxt, SolidStart or SvelteKit support.

**Known hydration gap:** native form values changed after SSR but before hydration
can be overwritten or diverge from the visible component state, including a
Checkbox's first later click not emitting a callback. Automatic preservation is
not supported. See the [pre-hydration investigation](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-prehydration-input.md)
for reproduced behavior and the still-proposed explicit adoption policy. Passing
the unchanged-DOM SSR tests does not resolve this separate input-loss risk.
An [experimental controlled adoption recipe](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-prehydration-recipe.md)
shows the narrow explicitly accepted snapshot path in four frameworks. Rejection,
field identity, reset and concurrent edits remain open policies; it is not a
production-ready or default restoration capability.

## Native form validation

`required` forwards the native constraint. A nonempty `error` displays an
associated message and sets native custom validity after client mount; clearing
it removes the custom error without removing `required`. Disabled controls are
excluded from constraint validation until re-enabled. SSR can render error text
and ARIA, but custom validity needs JavaScript and is not a server-side check.
See the [native form contract and test limits](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-native-forms.md).

## Changing Select options

A requested value absent from `options` renders an empty effective selection, not
the first available option. Its requested value is retained and restored when a
matching option arrives, without a fabricated change callback. Reordering and
relabeling preserve value. Disabling an already selected option does not clear it;
native submission excludes disabled options, so applications should explicitly
clear or validate withdrawn choices. See the [dynamic options contract and test
limits](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-select-dynamic-options.md).

## Required naming text

Checkbox/Select `label` and Dialog `trigger`/`title` must contain non-whitespace
text. Initial and reactive blank values throw a descriptive Ready error; valid
text is preserved, not trimmed. Optional placeholder/description can be empty.
There is no icon-only or alternate aria-label API in this pilot. See the
[naming-source contract and test limits](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-accessible-names.md).

For callback payloads, controlled ownership, runtime validation boundaries and
reproducible packed-consumer positive/negative type checks, see the
[consumer type contract](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-type-contract.md).
