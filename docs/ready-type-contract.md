# Ready consumer type contract

The pilot ships framework-compiled source, not a universal prebuilt JavaScript
entry. The authoritative component props come from the chosen `/react`, `/vue`,
`/solid` or `/svelte` subpath. `Option` is also exported from `/types`. The shared
callback-oriented prop aliases do not replace Vue's framework-specific emits or
Svelte's snippet types; extract the actual component props when wrapping an adapter.

## Typed API and runtime behavior

- `checked?: boolean`, `value?: string` and `open?: boolean` select controlled
  behavior when supplied; `undefined` uses local state. A controlled parent may
  accept or refuse a callback proposal. Omitted callbacks permit read-only
  controlled values. No `defaultChecked`, `defaultValue` or `defaultOpen` API is
  provided. Switching ownership mid-lifecycle is not a state-migration feature.
- `onCheckedChange` and `onOpenChange` receive a boolean; `onValueChange` receives a
  string, not a DOM Event, detail object or array. Vue exposes these corresponding
  events as well as `update:checked`, `update:value`, `update:open` for `v-model`.
- `required` and `disabled` are booleans, not HTML string attributes in a props
  object. `error` is an application-owned string; clearing it clears custom
  validity after client update, without clearing a separate required constraint.
- `options` is an array of `{value: string, label: string, disabled?: boolean}`.
  Equal labels with distinct values are allowed. Values must be unique and
  nonempty; labels must contain non-whitespace text. The TypeScript shape cannot
  express these array/content invariants, so shared runtime validation rejects
  their violations during rendering and updates, including SSR.
- Checkbox/Select `label` and Dialog `trigger`/`title` are required strings with
  non-whitespace content. Empty optional placeholder/description is allowed.
- There is no arbitrary DOM-attribute passthrough or generic `onChange` contract.
  The exported types intentionally describe the small composed API.

TypeScript checks do not run for plain JavaScript callers. The documented content
validators are **not** a complete runtime schema for every prop: JS callers still
need to supply the documented boolean/string/array/function types and validate
external data. Do not infer support for incorrectly typed values because a
particular framework happens to coerce or tolerate them.

## Reproduce the isolated consumer checks

First create installed consumers using the existing opt-in installation check:

```sh
node scripts/verify-ready-clean-consumers.mjs
```

Copy the absolute `Consumer evidence:` directory printed by that command, then:

```sh
node scripts/verify-ready-types-react-vue.mjs /tmp/ready-clean-consumers-EXISTING
node scripts/verify-ready-types-solid-svelte.mjs /tmp/ready-clean-consumers-EXISTING
```

Each command packs the **current** Ready source, extracts that tarball into new
consumer directories and imports it by package subpath, with no Ready source alias
back to this repository. React/Vue copy the prior consumers' installed dependency
trees; Solid/Svelte link those previously installed dependencies. These are
isolated tarball type-consumption checks using known installed peers, not new
network installs. The prerequisite installation script is separate. Results and
compiler diagnostics are written to the new evidence directories.

The checks exercise legal controlled/uncontrolled props, callback payload
inference, options, required/error and framework markup. Negative fixtures cover
missing required props, wrong prop/option/payload types and unsupported props.
`@ts-expect-error` assertions must be consumed; dedicated unsuppressed negative
fixtures also check expected diagnostics rather than accepting arbitrary compiler
failure. These scripts are opt-in and are not part of `npm test`.

No new type/runtime mismatch was found in this pass. The tests do not prove all
TypeScript versions, all bundlers, runtime input validation, browser behavior or
assistive-technology acceptance. Existing runtime/SSR regressions remain separate.
