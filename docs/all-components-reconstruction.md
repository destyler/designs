# All-component gallery reconstruction

This is a new reconstruction, not a recovered copy of the earlier unpublished v7 candidate. The previous candidate was not located in the current workspace, accessible task attachments, or the repository's named remote refs. This does not establish that every possible copy is permanently lost.

## Source and scope

- Designs baseline: merged main `5ec48d94874979d55c6983f7713ff20423020db8` from [dependency upgrade PR #1](https://github.com/destyler/designs/pull/1). Its source tree is identical to the validated dependency candidate `2de461c810960079489647a560b516059f138bfd`.
- Verified example source: [Destyler UI 0.0.4, commit 77c0653](https://github.com/destyler/ui/tree/77c065367954fe170ee71f6a6782929fd6ecd6f2).
- Runtime: React, Vue, Solid and Svelte UI packages pinned to `0.0.4`; core packages remain `0.3.4`.
- 46 distinct component families and 184 actual framework examples. No placeholders are counted as components.
- New gallery route: `/components/`, with links such as `/components/#calendar`.
- The existing `/` Switch/Dialog comparison, its components, CSS and dependency lock are preserved.

The gallery provides searchable family navigation, four isolated framework frames, independent light/dark controls, actual example/helper source, and the shared plain CSS. Source is exported from the files that are built, not handwritten excerpts. Embedded illustrations and offline tours avoid external media dependencies.

The new visual treatment derives from the published UI examples and uses Zinc neutral colors. It is not a reconstruction of the exact prior v7 visuals, a complete shadcn reference implementation, or a claim of pixel parity. The existing Switch/Dialog shadcn comparison remains available at `/`.

## Running and building

Use Node >=22.22.3. The tested environment uses Node 24.22.1 and npm 11.9.0.

```sh
npm ci
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run dev
```

`dev` builds the isolated frames and current source downloads before starting Astro. Production builds include the gallery, every frame, source JSON and CSS in `dist/`. Serve the **entire dist directory at the origin root**. Opening an HTML file directly with `file://`, or putting only the gallery under an unrelated subdirectory, is not equivalent because the page uses root-relative asset routes.

An individual frame accepts `/all-components/<framework>/?component=<family>&theme=dark|light`. The frame sets the document theme and a `<family>-basic` body class; React/Solid use a `.ds-example-content` root. The shared gallery CSS includes the demonstration layout contract. The Code tab is an example and its required helpers, not a complete installed project.

The existing published-style-package proof remains a Switch/Dialog proof. The new demonstration theme is not represented as a released all-component npm theme package.

## Repeatable verification

```sh
npm test
npm run check:all-components
ASTRO_TELEMETRY_DISABLED=1 npm run check:astro
npm run test:all-components
```

`test:all-components` rebuilds each framework's server/client verification bundles, checks all 184 examples, runs static duplicate-ID/label regressions, and tests the built gallery host. Its machine-readable report is `artifacts/all-components/aggregate.json`. Per-framework reports are in their ignored `.verification` directories.

Examples are server-rendered without browser globals, then hydrated with real framework clients in Happy DOM. Tests retain server nodes and record runtime warnings/errors. Selected repeated interaction regressions cover controls including checkboxes, switches, dialogs, tabs, selects, steps, trees, dynamic lists, tours and calendars. The host suite checks all 46 family routes, search, theme isolation, source/helper loading, simulated copy, tab controls, skip navigation and strict iframe readiness messages.

The reconstruction also corrected defects inherited from Basic demonstrations: a permanently controlled-open dialog, duplicate calendar selects/table IDs, horizontal scrollbar thumb orientation, unnamed icon/resize controls, and whitespace in calendar IDs using public ID customization. No library dependency was patched.

## Verified result (2026-11-06 UTC)

A fresh offline `npm ci` and all 16 final verification commands passed, including the complete production build, 51 unit tests (zero failures or skips), syntax and four-framework type checks, Astro checks (15 files, zero diagnostics), all preserved legacy/style-package regression suites, and `git diff --check`.

The all-component aggregate passed all eight stages: React, Vue, Solid and Svelte SSR/hydration (46 families each, 184 total), static semantics, stylesheet checks, built assets/exact source exports, and the gallery host. Every framework retained server-rendered nodes without recorded runtime warnings/errors. The source-export check matched all 184 source sets and 205 example/helper file entries. Stylesheet checks parsed 929 rules and 4,005 declarations without Lightning CSS warnings; the asset graph contained no missing or external dependencies.

After PR #1 merged, its main tree was verified identical to the original dependency baseline before the new gallery changes were replayed onto it. This preserves the tested application bytes rather than introducing an untested base change.

These results are automated source/SSR/Happy DOM checks, not real-browser or assistive-technology acceptance.

## Acceptance limits

- No real browser was launched for this reconstruction. Happy DOM does not establish rendered appearance, responsive layout, native focus trapping, pointer/touch geometry, browser clipboard/file-picker/download behavior, canvas drawing, or screen-reader results.
- SSR/static semantic checks are not a complete accessibility audit.
- The host suite simulates frame readiness and responses; it does not load the actual frame applications in a browser. A Vercel READY build alone would not close this gap.
- Upstream date-export warnings and large aggregate bundle warnings remain visible. The new gallery bundles all families per framework; no performance claim is made.
- Publication of this reconstruction is limited to an independent draft PR and a Preview deployment. Merging the gallery and releasing it to production remain separate decisions.

Upstream MIT attribution is retained in each framework README and the shared-theme README. The reconstruction does not replace the production site or overwrite any existing feature branch.
