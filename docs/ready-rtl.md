# Ready direction investigation (not complete RTL support)

Ready does not currently promise full RTL support. Translating `label`,
`placeholder`, `emptyMessage` and `closeLabel` does not configure direction.
An ancestor `dir="rtl"` alone is insufficient: the pinned UI primitives read
framework locale context, default to `en-US`/`ltr`, and write explicit `dir="ltr"`
on Checkbox, Select and Dialog parts. Ready has no new `dir` or `locale` prop.

## Explicit locale context

Use the existing UI provider for the same framework as the Ready adapter.
Set the surrounding DOM's language/direction too, so ordinary text outside the
primitives agrees with the provider. The provider selects direction from locale;
it does not translate Ready's default English messages. Supply translated text
props yourself. These are composition examples, not a claim of complete RTL QA.

React (Solid uses the same JSX shape, with imports from `@destyler-ui/solid`
and `@destyler/ready-prototype/solid`):

```tsx
import { LocaleProvider } from '@destyler-ui/react'
import { Checkbox } from '@destyler/ready-prototype/react'

<div lang="ar" dir="rtl">
  <LocaleProvider locale="ar">
    <Checkbox label="أوافق" />
  </LocaleProvider>
</div>
```

Vue:

```vue
<script setup>
import { LocaleProvider } from '@destyler-ui/vue'
import { Checkbox } from '@destyler/ready-prototype/vue'
</script>
<template>
  <div lang="ar" dir="rtl">
    <LocaleProvider locale="ar"><Checkbox label="أوافق" /></LocaleProvider>
  </div>
</template>
```

Svelte:

```svelte
<script>
  import { LocaleProvider } from '@destyler-ui/svelte/locale'
  import { Checkbox } from '@destyler/ready-prototype/svelte'
</script>
<div lang="ar" dir="rtl">
  <LocaleProvider locale="ar"><Checkbox label="أوافق" /></LocaleProvider>
</div>
```

Follow the pilot's [package installation instructions](../packages/ready/README.md);
the package is private and has not been published to npm. The provider already
comes from the adapter's UI dependency; no extra i18n framework is needed.

## Reproduce the limited checks

From the repository after `npm ci`:

```sh
node --test test/ready-rtl-react-vue.test.mjs test/ready-rtl-solid-svelte.test.mjs
```

The four real adapters are compiled and mounted in simulated DOM, both with
only an RTL ancestor and with `LocaleProvider locale="ar"`. Assertions cover:

- explicit direction on Checkbox, Select and Dialog parts;
- closed Select horizontal-arrow proposals and committed form values: LTR
  without the provider, reversed with the RTL provider;
- expanded Select Home/End/up/down highlighting, Enter selection and form data;
- Dialog opening and Escape closing.

These tests also run under `npm run test:ci`. They verify event-handler/state
behavior, not browser default keyboard behavior or rendering. They do not cover
SSR/hydration direction changes, dynamic locale switching, nested mixed-direction
providers, bidirectional text ordering, popup geometry, clipping, focus trapping,
mobile input or assistive technology. Those remain acceptance work before any
formal RTL support promise. Current CSS mostly uses symmetric spacing, flex/grid
and centered Dialog layout; that source inspection is not visual verification.
