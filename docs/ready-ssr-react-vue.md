# Ready React/Vue SSR and simulated hydration

## Method

Run from the repository root with dependencies installed:

```sh
node --test --test-concurrency=1 test/ready-hydration-react-vue.test.mjs
```

Each adapter has two independently compiled entries and two separate Node
processes. The server asserts that neither `window` nor `document` exists and
uses React `renderToString` or Vue `renderToString(createSSRApp(...))`. The client
loads the actual serialized HTML into Happy DOM before importing its runtime,
then uses `hydrateRoot` or `createSSRApp(...).mount(...)`, not client-only render.
This prevents a server import from polluting Vue's cached client document.

Fixtures render controlled Checkbox, Select and Dialog instances in default and
midnight theme scopes, plus an empty-selection scope. They use stable matching
React `identifierPrefix` / Vue `idPrefix` values on server and client.

## Findings and fix

React passed the tested server-render → hydrate path without a component change.

Vue initially serialized the hidden select with no selected option even when the
controlled value was `b`. The DOM parsed from that server HTML and its `FormData`
reported the first option `a`; hydration later changed it to `b`. IDs stayed stable
and there was no hydration warning, so absence of warnings alone would have missed
the incorrect server form state.

The Vue adapter now has a small internal `HiddenSelect.vue`. It renders exactly
one native select using the public primitive select context's props and field
context's `aria-describedby`. It explicitly serializes `selected` on options,
including the empty placeholder. Names, IDs, disabled attributes and focus
forwarding still come from the primitive. It adds no listener or duplicate input;
the existing primitive reset listener and Ready's client reconciliation remain.
No core/UI package change or release is needed.

## Verified coverage

React and Vue both pass the real SSR and simulated hydration regression after
the Vue fix:

- Server HTML has valid ARIA label/description references and unique IDs.
- Initial checkbox values, disabled options, and Select `a`, `b`, and empty values
  agree with native form values before and after hydration.
- Hydration reuses original form, input, select and dialog content nodes; it does
  not silently replace the server tree with a client-rendered alternative.
- No captured hydration warnings or React recoverable errors occur.
- After hydration, checkbox changes, Select selection, and Dialog open/close work
  through controlled parent state in the simulated DOM.

The existing Vue/Svelte form-reset and interaction suites separately protect
reset/cancelled-reset behavior, parent acceptance/refusal and submitted values.

## Limits

This is true server rendering followed by **simulated DOM hydration**, not a real
browser or screen-reader test. It does not establish layout, native focus/Tab
behavior, portal placement, pixel equivalence, streaming SSR, a specific SSR
meta-framework, or no-JavaScript usability. Separate cases start all Dialogs
closed or exactly one open in the default/midnight scope. Initially open cases
check simulated focus entry, return to the pre-hydration active element, global
lock installation/restoration and active-dialog unmount cleanup. Multiple
independent applications still need distinct Vue `app.config.idPrefix` values;
this test uses one application with multiple component scopes. Solid/Svelte
results are recorded separately and are not inferred from these adapters.
