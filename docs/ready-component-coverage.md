# Ready component coverage and implementation queue

**Scope:** component code, package exports, tests, and usage contracts. The
website and gallery are not part of this work. This is a working inventory for
planning Ready, not a previously agreed Ready release scope or a promise to
ship every item. Check the current implementation and its evidence before
changing a status.

## Baseline and evidence

- The private Vite-source package at Ready baseline `1c498da` exports **Checkbox,
  Select, Dialog** in React, Vue, Solid, and Svelte. They are implemented, not
  published or fully browser/assistive-technology certified. Check the
  [Ready README](../packages/ready/README.md) and [delivery status](ready-delivery-status.md)
  for the support boundaries of that slice.
- The comparison inventory is the [46-family gallery catalog](https://github.com/destyler/designs/blob/70dac1cf17a0ddde062cb413540fe81bfdadf716/examples/all-components/shared/catalog.json)
  at `rebuild/all-components-20261106` commit `70dac1c`, including 184 actual
  framework examples. Its [reconstruction report](https://github.com/destyler/designs/blob/70dac1cf17a0ddde062cb413540fe81bfdadf716/docs/all-components-reconstruction.md)
  describes the differing example-source and runtime versions. These are
  gallery demos of UI primitives, not packaged Ready implementations.
- On this checkout's locked `@destyler-ui/*@0.0.5`, a read-only comparison found
  an exact match for all 46 catalog slugs in each gallery registry and found
  all 46 corresponding upstream export targets in each framework. For React
  and Vue, the check imported named runtime exports from the package root.
  For Solid, it checked the wildcard subpath export and each concrete JS and
  declaration. For Svelte, it checked the explicit subpath exports and their
  concrete JS and declarations. This confirms availability of the inputs, not interaction or build parity of
  future Ready wrappers. The demos linked by the gallery registries show the
  exact upstream import conventions.

| Status | Families | Count |
| --- | --- | ---: |
| Implemented in the Ready baseline | `checkbox`, `dialog`, `select` | 3 |
| Implemented in this batch; real browser acceptance is still open | `switch`, `pagination`, `tabs`, `progress`, `collapsible`, `toggle`, `separator`, `fieldset`, `avatar`, `aspect-ratio`, `breadcrumbs`, `radio` | 12 |
| Subsequent consumer candidates | All slugs in batches 1–5 below | 30 |
| Supporting primitive only | `presence` | 1 |
| **Canonical gallery inventory** | The union above, without duplicates | **46** |

An implementation checkpoint includes four package exports and component regressions. It does not mean each family passed the full release gates below. Advance and record release verification independently for each family.

## What the queue does and does not count

- **Presence is real but not a leaf control.** All four gallery examples toggle
  an element's mount/exit lifecycle. React and Vue export `Presence` at the root,
  Solid and Svelte expose the `presence` subpath. Use it internally for
  disclosure or overlays where needed; do not count four implementations of a
  support primitive as a new Ready consumer family. This is not a missing React
  export: it exists as a direct named export, not only a namespaced part.
- **Collapse and Collapsible are distinct.** The former is a multi-item
  accordion-style container (with item values, disabled items and single/multiple
  open policy); the latter is a single disclosure. Retain both upstream slugs,
  and document the Ready naming instead of treating the first Collapsible as
  both. Likewise Toggle is one pressed control; Toggle Group adds group
  selection and keyboard behavior. Dialog, Popover, Hover Card, Tooltip and
  Floating Panel have different dismissal/focus rules.
- **Semantic wrappers are an API choice, not a framework gap.** Label,
  Fieldset, Separator and Aspect Ratio have simple HTML/CSS building blocks.
  Their upstream UI implementations still exist in all four frameworks.
  In Ready, count them only if the wrapper clarifies a real shared contract,
  such as label association, grouped form semantics, separator role and
  orientation, or reusable sizing. Ordinary Button, Input and Textarea are
  native HTML controls and not separate families in this gallery inventory.
  A component's slots and native controls do not each count as another family.
- **Providers, internal helpers and core-only exports are not missing leaf
  components.** The locked packages expose helpers such as ClientOnly,
  EnvironmentProvider, FocusTrap, Format, Frame, Highlight and LocaleProvider
  outside the 46 gallery families. Solid's package separately maps
  `collection`/`factory`; Svelte's root exports `portal`. The locked core
  packages include `@destyler/collection`, `@destyler/dismissable`,
  `@destyler/interact-outside`, and `@destyler/popper`; they are
  infrastructure rather than standalone Ready controls. Distinguish a missing
  framework wrapper from a different subpath/name or an HTML implementation.
  No framework-specific family gap was found in **this intersection of 46 at
  UI 0.0.5**. No other framework, renderer, dependency version, or package
  export outside that intersection is promised.

## Subsequent batches (proposal)

| Batch | Exact gallery slugs | Count | Important gate beyond the common gate |
| --- | --- | ---: | --- |
| 1. Common form foundations | `field`, `label`, `number-input`, `otp-input`, `slider`, `file-upload` | 6 | Labels, validation, form value/disabled/required/reset; number locale; OTP typing/paste, slider keyboard and range limits, upload no-op/replacement and restriction messaging. |
| 2. Layout and structure | `collapse`, `scroll-area`, `splitter` | 3 | Ordered accordion state, layout at small widths and zoom, keyboard scrolling and resizing. |
| 3. Selection, navigation and collections | `calendar`, `carousel`, `combobox`, `dynamic`, `navigation-menu`, `steps`, `tree` | 7 | Current/link semantics, stable keys and focus when items change, keyboard/selection policy and disabled entries; calendar locale, constraints and outside-month policy. |
| 4. Overlay workflows | `floating-panel`, `hover-card`, `menu`, `popover`, `toast`, `tooltip`, `tour` | 7 | Deliberate disclosure/focus semantics, dismissal and restoration per family, reduced motion, correct announcements where intended, and theme boundaries in real browsers. |
| 5. Specialized controls | `clipboard`, `color-picker`, `edit`, `qr-code`, `signature`, `timer`, `toggle-group` | 7 | Clipboard permission/error states; numeric or keyboard alternatives to pointer-only interaction, canvas/export constraints, output announcement, cleanup of timers, and independent/grouped pressed behavior. |

These are dependency-oriented buckets, not deadlines. Small independent
families can move forward when their API and test plan are ready. For example,
Tooltip must not silently become a keyboard-inaccessible Popover; do not
promote complex overlay families until they have their own relevant browser
checks. Native input integration (File Upload, OTP, Slider), structured data
(Calendar, Tree) and modality (Floating Panel, Tour) warrant their own review
even if another family in the same batch is ready.

## Accepting a family

1. **Composed public API.** One idiomatic entry per framework, common semantic
   props with native event/slot conventions, useful accessible name and depth
   of composition comparable to a Ready control. State ownership, defaults,
   controlled updates and callbacks, disabled state, and unsupported modes
   must be explicit. Do not promise impossible equivalence (e.g. HTML form
   submission from a presentational control).
2. **Package and theme.** Export from the correct shared package subpaths, pack
   every referenced source file and stylesheet, and validate a separate locked
   Vite consumer for each selected framework. An app installs only its own
   matching UI and renderer peers. All four builds/types/contract checks pass;
   verify the tarball contents rather than relying on workspace imports.
   Verify no theme wrapper is required for default styling and shared semantic
   tokens work in both built-in scopes and a custom override. Preserve
   `theme.css` as a deliberate CSS side effect.
3. **Regression matrix.** Test the four real compiled adapters, their positive
   and negative type contracts, SSR/hydration when relevant, and browser
   interaction for the states that matter to the family. At minimum use a
   keyboard with visible focus, a pointer, and a small viewport; check markup
   semantics, invalid/missing accessible labels, scope isolation, and cleanup
   when relevant. Native-form families need real submit/reset behavior; overlay
   families need focus/dismissal/scrolling checks. Pin the code revision and
   report automated DOM, browser, and manual assistive-technology evidence
   separately. Known pre-hydration loss, nested-overlay and portal constraints
   stay visible until proven resolved.
4. **Release handoff, not publication.** Update the package README and runnable
   consumer usage (including versions and limitations); record per-family
   evidence. Use `npm run check:ready`, `npm run check:ready:contracts`,
   `node --test test/ready-*.test.mjs`, `npm run build:ready` and the
   [clean consumer verification](ready-clean-consumer-verification.md) as
   applicable, plus targeted real-browser checks. A pass establishes only the
   matrix exercised. Ready remains private/Vite-source unless distribution and
   compatibility are explicitly agreed; no website changes, publish, merge, or
   deploy follows automatically from this checklist.
