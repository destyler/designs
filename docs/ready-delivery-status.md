# Ready pilot: delivery boundary

The smallest useful delivery is three composed components for the tested Vite
consumer profile, not a new general component framework. Checkbox, Select and
Dialog have native adapter conventions, a shared optional-description API for
fields, and two themes over the same 14 semantic tokens. A plugin system is not
required to add a theme: an application can override those tokens.

## What a consumer can use now

- A private source tarball with explicit React/Vue/Solid/Svelte entry points and
  a separately imported stylesheet. The documented generator creates a consumer
  that installs only its selected framework peers and can type-check/build.
- Labels, descriptions, error messages and configurable Select/Dialog text;
  controlled and uncontrolled state; the documented form/reset behavior.
- Default, Midnight and scoped custom token overrides without component forks.
- Real server rendering followed by simulated hydration checks, including IDs,
  descriptions, errors, dynamic options and the original requested reset value.

See [quickstart](./ready-quickstart.md),
[text customization](./ready-text-customization.md), and
[theme contract](../packages/ready/THEMING.md). These are specific supported
contracts, not claims about every bundler or all possible JavaScript inputs.

## Remaining delivery gates, in priority order

1. **Real-browser acceptance of an authorized current preview.** Check narrow
   viewports, zoom/long text, both themes, focus visibility and restoration,
   keyboard/pointer/touch, long-list scrolling, native form submission/validation,
   and at least the intended screen-reader/browser combination. Simulated DOM
   tests and static contrast math do not establish these. No current PR preview,
   authenticated session or browser acceptance is claimed by this document.
2. **Overlay use cases must stay within a verified boundary.** Inline overlays
   preserve theme tokens but cannot escape clipping or stacking ancestors.
   Dialog's own scrollable content can clip a contained Select. If that use case
   is required, verify it in a browser before promising support; a general portal
   and theme bridge is a separate change, not something a larger z-index fixes.
3. **Choose the release profile before publication.** This package is private,
   version 0.0.0 and source-only. Publishing, supported-version policy and any
   prebuilt/distribution format are separate decisions. Do not advertise direct
   Node, arbitrary bundler or full meta-framework compatibility from Vite tests.

## Explicit non-goals are not hidden workarounds

- Pre-hydration native input restoration is not automatically preserved; the
  opt-in experimental recipes do not change that default contract.
- Synchronous change callbacks are proposals, not a guarantee that native
  FormData already reflects the parent's accepted state.
- Automatic ancestor Field helper references still appear only after mount.
  Ready-owned `description` is the simpler SSR-associated path.
- Arbitrary native attribute forwarding, readOnly, generic nested modal stacks,
  RTL, virtualization, loading orchestration and a plugin system are not promised.
  Add these only for a concrete consumer need rather than enlarging the pilot.

The current long-list change adds a shared height/overflow constraint and
simulated keyboard regressions. It does not close the real-browser gate above.


A [Dialog-local overlay host experiment](./ready-dialog-overlay-host-experiment.md)
now records topology/focus checks and concrete SSR dismissal/theme-loss limits.
It does not replace Ready's inline defaults or close the overlay/browser gates.
