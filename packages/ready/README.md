# Ready component slice (private experiment)

Three composed controls, four framework adapters, one semantic CSS contract.
Import Checkbox, Select and Dialog from the framework folder and import theme.css
once. Wrap consumers in data-rd-theme="default" or "midnight". Components never
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
