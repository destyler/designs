# Original shadcn reference for the 46-family gallery

This frame restores the actual shadcn side of the comparison. It does not import
Destyler components, the Destyler gallery theme, or generated Destyler recipes.
The original source pin is
`shadcn-ui/ui@4aaea19d9cff3e0908e12a8c1d504b8c5ec34610`.

## What is being compared

`../shared/shadcn-coverage.json` describes every one of the 46 Destyler families:

- **32 direct:** actual, byte-preserved upstream components, including this
  revision's Base UI Combobox and the FieldSet export in `field.tsx`.
- **1 composed:** clipboard uses the original Button with an explicitly
  application-authored Clipboard API action and success/failure feedback.
- **13 none:** color-picker, dynamic, edit, file-upload, floating-panel,
  number-input, presence, qr-code, signature, steps, timer, tour, and tree.
  Each shows an informative absence state and a pinned upstream directory link.
  Native inputs, canvases, or home-made widgets are not presented as originals.

"Direct" identifies a corresponding upstream component family. It does not
assert complete behavior, API, accessibility, or visual equivalence. For example,
Collapse maps to Accordion, Splitter to Resizable, and Toast to the original Sonner
wrapper. The Calendar reference is its date-selection surface, not all of
Destyler's input/popover/preset/month-grid/year-grid interface. Carousel does not
add autoplay, Menu does not include ContextMenu, and Progress is linear only.
These limitations are visible in the selected family's metadata.

The pinned ComboboxInput convenience trigger and clear icons lack accessible
names. This demo disables those convenience icons and composes the original
exported ComboboxTrigger with an explicit accessible name, plus an original
Button labeled Clear for controlled clearing. Vendor bytes remain unchanged.

The pinned Progress wrapper consumes `value` for its visual transform without
forwarding it to Radix Root. This application supplies `aria-valuenow` and
`aria-valuetext` explicitly, while preserving the source bytes. The original
Root/Indicator `data-state` remains `indeterminate`; this is not full determinate
state equivalence.

## Sources and rendering

- `demos/<family>.tsx` is the exact application-authored demo composition for
  each family. Content, layout and state handlers are not claimed to be copied
  upstream demos. Labels, values and options match the Destyler examples where
  practical.
- `../../../vendor/shadcn/new-york-v4/ui/*.tsx` holds untouched pinned originals.
  Vite aliases resolve upstream `cn` and registry imports without rewriting them.
- `../../../docs/shadcn-gallery-sources.json` records retrieved source hashes and
  the directory inventory. `../../../vendor/shadcn/LICENSE` contains the MIT
  notice. See the vendor gallery README for provenance and dependencies.
- `reference.css` uses the original Zinc token values, original component classes,
  Tailwind v4 and `tw-animate-css`. Only frame/demo layout is application CSS.
  CSS source scanning excludes generated verification bundles, ensuring that
  running the tests cannot add incidental classes to the production stylesheet.
- The host's per-family source export includes the selected demo, transitive
  vendored sources, utility, styles, metadata and license. No Destyler theme is
  appended to the shadcn source set.

The URL is `/all-components/shadcn/?component=<family>&theme=light|dark`.
`configuration.ts` is the query parser used by both `main.tsx` and verification.
`Frame.tsx` emits the existing `destyler:all-components-ready` message with
`framework: 'shadcn'` only from its mounted effect. An unknown component never
emits readiness. A valid absent family does emit readiness after its informative
state has mounted. The legacy root comparison is not changed by this frame.

## Reproducible local checks

From the repository root:

```sh
npx tsc -p examples/all-components/shadcn/tsconfig.json
npx vite build --config examples/all-components/shadcn/vite.config.ts
node examples/all-components/shadcn/verify.mjs
```

The verifier writes `.verification/verification.json` with:

- Server rendering for all 46 states without browser globals, source-boundary
  assertions, valid unique IDs and zero captured warnings/errors.
- Simulated hydration for all 46 states, preserved interactive server nodes,
  per-family interaction/structure assertions, and an honest separation between
  33 control/composition demos and 13 absence states.
- Expected post-mount removal of Radix's server-rendered form-compatibility fields
  outside a form: Checkbox 1, Radio 4, Switch 1, Slider 2, Select 1 hidden select
  plus its empty option. Actual retained and removed counts are recorded; these
  expected effects are not misreported as retention of every server node.
- Repeated open/close, check/uncheck, selection, cancel/Escape, pagination bounds,
  calendar navigation, OTP input, toast dismissal, and clipboard success/failure
  where the DOM simulation supports meaningful checks.
- Query parsing and readiness for light, dark, absent, invalid, and default
  requests. Readiness is not sent synchronously before a committed mount.
- React recoverable/caught/uncaught errors, window errors/unhandled rejections,
  and both global and window console warnings/errors captured through cleanup.

**Happy DOM is not a browser.** There is no browser launch in these checks.
Rendering/CSS, geometry, actual pointer/touch behavior, portal placement, focus
trapping, real clipboard permissions, and assistive technology remain pending.
Carousel and resizable panels are mounted and structurally checked, not certified
for real layout/drag behavior. No screenshot or accessibility-conformance claim
is made by this suite.
