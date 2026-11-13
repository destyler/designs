# Ready: real SSR and simulated hydration

This checks the private Vite source package on the repository's pinned dependency
versions. It is not a claim of Next.js, Nuxt, SolidStart or SvelteKit integration,
streaming SSR, or real-browser acceptance.

**Important:** these fixtures hydrate unchanged server DOM. Values edited or
restored before hydration expose a separate [known input-preservation gap](./ready-prehydration-input.md),
including overwritten Select values and divergent Checkbox state. The passing
checks below do not cover or resolve that gap.

## Reproduce

From the repository root after `npm ci`:

```sh
node --test --test-concurrency=1 test/ready-hydration-react-vue.test.mjs test/ready-hydration-solid-svelte.test.mjs
```

Each test compiles separate server and client entries. A server Node process with
no `window` or `document` produces HTML. A different process parses that HTML into
Happy DOM and runs the actual framework hydration API. This is not replacing SSR
with client-only rendering. Original nodes, identifiers and form state are checked
before and after hydration, alongside warnings and subsequent interactions.

| Adapter | Server renderer | Client hydration |
| --- | --- | --- |
| React | `renderToString` | `hydrateRoot` |
| Vue | `renderToString(createSSRApp(...))` | `createSSRApp(...).mount(...)` |
| Solid | `renderToString` and generated hydration bootstrap | `hydrate` |
| Svelte | `svelte/server` `render` | `hydrate` with recovery disabled |

The fixtures use the respective Vite framework plugins. Solid needs the plugin's
SSR/hydratable compilation and its official `generateHydrationScript` bootstrap;
Solid/Svelte SSR builds bundle their dependencies with `ssr.noExternal: true` so
server compile conditions are applied. These tested configurations are not a
claim that every bundler's default export resolution works. React/Vue use matching
server/client ID prefixes. Independent Vue applications still need distinct
`app.config.idPrefix` values.

## Defect found and fixed

Vue, Solid and Svelte initially rendered a controlled Select value of `b` without
an option carrying `selected`. A native select parsed from that HTML defaulted to
the first option `a`, so its initial form value was wrong until hydration. Testing
only first-option values would miss this. Absence of hydration warnings alone was
also insufficient evidence.

Each affected Ready adapter now renders its single hidden native select through
a small internal helper. The helper uses public primitive/field context props and
explicitly serializes selected options, including the empty placeholder. It keeps
the primitive's name, ID, disabled/focus attributes and existing reset listener;
no duplicate input or listener is added. Client reconciliation remains in place.
React required no implementation change. No core/UI release is involved.

## Coverage and boundaries

- Checkbox checked/unchecked state; Select first, non-first and empty values.
- Multiple theme scopes and stable IDs/ARIA links through hydration.
- Reuse of the server-rendered nodes rather than a silent client-only replacement.
- No captured hydration warnings for the tested fixtures.
- After hydration, checkbox changes, Select selection and Dialog open/close in
  simulated DOM. A single initially open Dialog is also covered across all four
  adapters, including focus requests and cleanup (details below).
- Existing reset, disabled-control and packed-consumer suites remain separate.

Happy DOM incorrectly includes a disabled native `select` in `FormData`; an
independent plain-HTML control reproduces this. The disabled SSR case checks the
actual disabled attribute/property and its preservation through hydration, not
browser-correct exclusion from submission. No patched FormData implementation is
used to claim a pass.

These tests do not establish computed styling, native Tab order/focus trapping,
no-JavaScript usability, screen-reader behavior, portal placement or general
nested modal support. Theme checks concern markup/DOM scope, not rendered pixels.
See [React/Vue detail](./ready-ssr-react-vue.md) for that pair's isolated-process
method and the original Vue failure.

## Initially open Dialog coverage

The initially open fixtures render one modal open on the server, with the other
scopes closed. React/Vue retain separate all-closed, default-scope-open and
midnight-scope-open cases; Solid/Svelte exercise an initially open default scope
alongside closed scopes. No simultaneous multi-modal stack is implied.

Hydration preserves server IDs, ARIA links, original nodes and theme containment.
The simulated active element moves into the dialog. Closing requests focus back
to the element focused before hydration, not an unclicked dialog trigger. Reopen
and active-dialog disposal checks verify global styles/locks are cleaned up;
React/Vue also assert background aria-hidden restoration. These cases produced
no captured hydration warnings and required no component implementation change.

This is evidence about actual framework hydration and simulated focus requests,
not native browser focus navigation, visual layout, screen-reader announcements
or safe use of arbitrary multiple/nested modal stacks.
