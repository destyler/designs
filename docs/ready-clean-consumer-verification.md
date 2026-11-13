# Ready: clean Vite consumers

Verified on 2026-11-13 against Ready source at `74c9102`, Node 24.22.1,
npm 11.9.0. This is a private source-package pilot, not a published package.

## Reproduce

```sh
node scripts/verify-ready-clean-consumers.mjs
```

This opt-in command needs npm registry access. It is intentionally not part of
`npm test`. It creates a fresh `/tmp/ready-clean-consumers-*` directory, packs
`packages/ready`, and actually installs that tarball in four independent npm
projects. No repository `node_modules`, dependency symlinks, source aliases, or
`NODE_PATH` fallback are used. npm's download cache is under `/tmp`; sharing
cached registry downloads does not share installed dependency trees.

The temporary directory is retained and printed. Each consumer includes its
manifest, lockfile, install/build/type logs, runtime resolution log, complete
`npm ls --all --json` output and built assets. `results.json` records outcomes.
Failures retain a `failure.log` and cause a nonzero exit.

## Result

| Consumer | npm install / peer tree | Vite production build | Type check |
| --- | --- | --- | --- |
| React | Pass | Pass | `tsc`: pass |
| Vue | Pass | Pass | `vue-tsc`: pass |
| Solid | Pass | Pass | `tsc`: pass |
| Svelte | Pass | Pass | `svelte-check`: 0 errors, 0 warnings |

All consumers import Checkbox, Select and Dialog from the package's framework
subpath, plus `@destyler/ready-prototype/theme.css`. The copied demo is compiled
as an actual mounted application, including its callback/slot usage, rather
than merely re-exporting unused imports. Runtime and package resolution paths
were asserted to stay inside each consumer's installed tree. Each tree contains
only its selected `@destyler-ui` adapter. The final emitted CSS contains both
`--rd-accent` and `--rd-backdrop`.

### Direct dependency versions

All four consumers: Vite 7.1.12, TypeScript 5.9.3, selected
`@destyler-ui/{framework}` 0.0.5, packed Ready 0.0.0.

- React: react/react-dom 19.2.0, @vitejs/plugin-react 5.0.4,
  @types/react/@types/react-dom 19.2.2.
- Vue: vue 3.5.22, @vitejs/plugin-vue 6.0.1, vue-tsc 3.1.1.
- Solid: solid-js 1.9.17, vite-plugin-solid 2.11.14.
- Svelte: svelte 5.57.2, @sveltejs/vite-plugin-svelte 6.2.4,
  svelte-check 4.7.8.

The script reads exact versions from the repository manifest and fails if any
is absent. Transitive ranges resolve fresh on install; generated lockfiles
record the particular resolution. Later registry changes may change those
transitives. Only a selected framework's compiler/runtime/types are requested;
optional peers do not pull the other three UI adapters into the consumer.

## Scope and limits

No Ready source defect was exposed by this clean-install check. A first test
harness attempt tried runtime resolution of `@types/react`, which deliberately
has no runtime root export; this was corrected to resolve only runtime packages.
That was a verifier issue, not a Ready package failure.

This validates installation, package entry resolution, Vite compilation,
consumer-side type checking and CSS retention. It does **not** execute the
built applications in a browser or add new interaction/accessibility evidence.
Existing simulated-DOM interaction tests remain separate. No other bundler,
Node-only execution, SSR framework integration or production release is claimed.
