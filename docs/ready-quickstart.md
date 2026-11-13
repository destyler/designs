# Ready: from checkout to a private Vite consumer

This guide uses the private source package, not a published npm package. It needs
Node 22.12+ (verified with Node 24.22.1/npm 11.9.0), registry access, and a checkout
of this branch. The generator only writes files into an empty directory. It reads
the exact source blocks below, so the documented examples are the ones compiled
by the opt-in verification, not substitute internal test fixtures.

## 1. Pack and create an application

Run this in the **designs repository root**. Choose exactly one framework:

```sh
framework=react # or vue, solid, svelte
repo="$PWD"
work="$(mktemp -d /tmp/ready-guide-XXXXXX)"
npm pack ./packages/ready --pack-destination "$work" --cache /tmp/ready-npm-cache
node scripts/create-ready-consumer.mjs "$framework" "$work/app" "$work/destyler-ready-prototype-0.0.0.tgz"
cd "$work/app"
npm install --cache /tmp/ready-npm-cache
npm run check
npm run build
npm run dev
```

The tarball filename includes the current package version (currently `0.0.0`);
use the filename printed by `npm pack` if that changes. No repository dependency
installation is needed to run the pack/generator commands. After `cd`, commands
run in the **new consumer**, not in the checkout. `npm run dev` starts a local
server; open its printed URL yourself. Stop it with Ctrl+C. This does not publish
to npm or deploy anything.

The generator creates a normal editable `package.json`, `vite.config.mjs`,
`tsconfig.json` and the files below. It refuses to overwrite a nonempty directory.
It installs nothing itself; inspect the files before running `npm install`.
The generated manifest pins the versions from the repository manifest:

| Framework | Runtime/UI peer | Compiler and types |
| --- | --- | --- |
| React | react + react-dom 19.2.0; @destyler-ui/react 0.0.5 | @vitejs/plugin-react 5.0.4; @types/react + @types/react-dom 19.2.2 |
| Vue | vue 3.5.22; @destyler-ui/vue 0.0.5 | @vitejs/plugin-vue 6.0.1; vue-tsc 3.1.1 |
| Solid | solid-js 1.9.17; @destyler-ui/solid 0.0.5 | vite-plugin-solid 2.11.14 |
| Svelte | svelte 5.57.2; @destyler-ui/svelte 0.0.5 | @sveltejs/vite-plugin-svelte 6.2.4; svelte-check 4.7.8 |

Each uses Vite 7.1.12 and TypeScript 5.9.3. Only the chosen framework's peers are
requested. These are tested versions, not a promise that every version or bundler
works. The consumer gets its own node_modules and lockfile, not a symlink to the
checkout. `npm run check` type-checks; `npm run build` is a separate compile step.

## 2. Shared document and custom style

The package CSS must be imported before `app.css`. `data-rd-theme="default"`
provides all token defaults; use `midnight` for the second built-in theme. The
sample overrides three tokens on the same scope without changing component APIs.
Remove `class="brand"` to see the unmodified theme. See the package's
[theme guide](../packages/ready/THEMING.md) for inheritance and overlay limits.

```html file=common/index.html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ready consumer</title></head>
  <body><main id="app" class="brand" data-rd-theme="default"></main><script type="module" src="/main.tsx"></script></body>
</html>
```

```css file=common/app.css
[data-rd-theme].brand {
  --rd-accent: #5b21b6;
  --rd-on-accent: #fff;
  --rd-radius: 16px;
  padding: 24px;
}
.rd-component { margin-block: 16px; }
```

## 3. Minimal framework entry

These examples intentionally use local, uncontrolled state. Supply `checked`,
`value` or `open` and handle the matching callbacks for controlled applications;
Vue uses `v-model:checked`, `v-model:value`, `v-model:open`. Select values must be
unique nonempty strings. This example is not a form submission or validation
recipe. The Dialog body uses normal framework children/slots.

### React

```tsx file=react/main.tsx
import { createRoot } from 'react-dom/client'
import { Checkbox, Select, Dialog } from '@destyler/ready-prototype/react'
import '@destyler/ready-prototype/theme.css'
import './app.css'

createRoot(document.getElementById('app')!).render(<>
  <Checkbox label="Email updates" description="Only important product news." name="updates" />
  <Select label="Plan" description="You can change this later." options={[{ value: 'starter', label: 'Starter' }, { value: 'studio', label: 'Studio' }]} />
  <Dialog trigger="About this plan" title="Your workspace"><p>Choose the plan that fits.</p></Dialog>
</>)
```

### Solid

```tsx file=solid/main.tsx
import { render } from 'solid-js/web'
import { Checkbox, Select, Dialog } from '@destyler/ready-prototype/solid'
import '@destyler/ready-prototype/theme.css'
import './app.css'

render(() => <>
  <Checkbox label="Email updates" description="Only important product news." name="updates" />
  <Select label="Plan" description="You can change this later." options={[{ value: 'starter', label: 'Starter' }, { value: 'studio', label: 'Studio' }]} />
  <Dialog trigger="About this plan" title="Your workspace"><p>Choose the plan that fits.</p></Dialog>
</>, document.getElementById('app')!)
```

### Vue

For multiple independent Vue apps on the same page, give **each** app a distinct
`app.config.idPrefix` before mounting. One app can contain many Ready components.

```ts file=vue/main.tsx
import { createApp } from 'vue'
import App from './App.vue'
import '@destyler/ready-prototype/theme.css'
import './app.css'

const app = createApp(App)
app.config.idPrefix = 'preferences'
app.mount('#app')
```

```vue file=vue/App.vue
<script setup lang="ts">
import { Checkbox, Select, Dialog } from '@destyler/ready-prototype/vue'
</script>
<template>
  <Checkbox label="Email updates" description="Only important product news." name="updates" />
  <Select label="Plan" description="You can change this later." :options="[{ value: 'starter', label: 'Starter' }, { value: 'studio', label: 'Studio' }]" />
  <Dialog trigger="About this plan" title="Your workspace"><p>Choose the plan that fits.</p></Dialog>
</template>
```

### Svelte

```ts file=svelte/main.tsx
import { mount } from 'svelte'
import App from './App.svelte'
import '@destyler/ready-prototype/theme.css'
import './app.css'

mount(App, { target: document.getElementById('app')! })
```

```svelte file=svelte/App.svelte
<script lang="ts">
  import { Checkbox, Select, Dialog } from '@destyler/ready-prototype/svelte'
</script>
<Checkbox label="Email updates" description="Only important product news." name="updates" />
<Select label="Plan" description="You can change this later." options={[{ value: 'starter', label: 'Starter' }, { value: 'studio', label: 'Studio' }]} />
<Dialog trigger="About this plan" title="Your workspace"><p>Choose the plan that fits.</p></Dialog>
```

## Verification and limits

From the **repository root**, run
`node scripts/verify-ready-clean-consumers.mjs --documented` to pack, generate
these exact examples in four fresh `/tmp` consumers, install, check peer trees,
compile and type-check. Logs and lockfiles remain in its printed directory. This
is opt-in because it needs the registry; it is not part of the default unit suite.

The package stays a Vite-compiled TS/TSX/Vue/Svelte source package with no root
component export. Installation/build/type checking does not prove native browser
interaction, screen-reader output, contrast, mobile behavior or unrestricted
portal/nested-overlay support. Do not place theme scopes in clipped/transformed
or isolated stacking containers. No production or npm release is implied.

### Recorded result

Verified against the `2993a23` base plus this documentation/theme-guide change,
using Node 24.22.1 and npm 11.9.0. Four independent npm-installed consumers passed
peer-tree checks, `npm run build`, and `npm run check` (Svelte: zero errors and
warnings). Their final CSS retained the documented custom accent, on-accent and
radius declarations, and their HTML retained the theme scope. This checks emitted
source/assets, not visual color contrast or computed cascade in a browser.

The generated React application also started with
`npm run dev -- --port 5179 --strictPort`. HTTP requests to `/`, `/main.tsx` and
`/app.css` returned 200 with the expected theme markup, component import and
custom CSS; the dev server was then stopped. This is an HTTP startup smoke only.
Dev startup was not separately tested for the other three adapters. An initial
attempt to fetch from a separate command session returned connection refused;
launching the server and fetching within one command session completed the smoke.
