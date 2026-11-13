# Experimental Dialog-local overlay host

This is a feasibility experiment, **not** a change to Ready's components, public
API, default CSS or supported overlay contract. It uses the pinned public React
UI primitives and React portals to investigate one Dialog containing one Select.
It is not a four-framework implementation or a browser clipping fix.

## Running the opt-in experiment

With this checkout's dependencies installed, run:

```sh
node scripts/experiment-ready-dialog-overlay-react.mjs
```

It creates isolated server/client bundles, renders without DOM globals, hydrates
in Happy DOM and writes JSON observations to the printed temporary evidence
directory. It is intentionally not part of `npm test` or the packed Ready package.
Exit zero means the structural assertions and four ordinary scenarios passed.
The initially open Select case is reported as `OBSERVED (not acceptance)`; inspect
its JSON `firstEscape` and `knownInitialSelectOpenLimit` fields. It is not counted
as a passing layered-dismissal case. No successful exit makes this architecture
ready for production.

## Proposed structure

```text
Dialog.Content (non-scrolling boundary)
├─ title / description
├─ content scroll region
│  └─ Select trigger + native form control
├─ overlay host (outside the scroll region, still inside Content)
│  └─ Select Positioner + Content
└─ close button
```

The host must not become a sibling of Dialog.Content or a child of its scroll
region. Dialog's focus boundary, outside-interaction handling and aria-hidden
preservation are tied to Content. A body portal would leave that boundary;
putting the host under the scrolling region would retain the clipping problem.
The prototype creates the host in server markup, hydrates the initial inline
structure, then mounts the popup portal after the host is available. It does not
move server DOM before hydration or manually append framework-owned nodes.

## What this does not solve automatically

- **Nearest-theme inheritance.** A Select inside a deeper theme or ordinary custom
  token wrapper loses that ancestor when its popup moves to the shared host.
  Framework context does not preserve DOM-based CSS inheritance. The experiment
  deliberately checks this negative case rather than adding a partial theme copy.
  Copying only a theme name would still miss arbitrary custom token overrides.
- **Continuous popup node ownership.** Switching from inline rendering to a portal
  can recreate popup nodes. Stable ARIA IDs do not mean the same DOM node or focus
  continuity. Initially open SSR popup behavior needs separate evidence.
- **Positioning.** Select's absolute positioning must be calculated against the new
  offset parent. Old `--x`/`--y` values are not reusable proof. Popper's remounted
  listeners must handle the new reference/floating ancestor relationship.
- **Real layout.** DOM containment cannot establish clipping, available-height
  behavior, hit testing, stacking, scroll following or focus-ring visibility.

## Observations from the simulated experiment

- Default/Midnight outer theme × initially closed/open Dialog, with Select
  initially closed: Dialog/trigger nodes hydrate in place and primitive IDs stay
  stable. The popup is recreated when the portal activates, not hydrated in its
  final host. Opening later permits child-first Escape handling and cleanup of
  the modal's global pointer/scroll/aria-hidden effects.
- The popup remains inside Dialog.Content and outside the scroll region. Its
  ancestor chain is checked for `aria-hidden`/`inert`; this is not a browser
  accessibility-tree or screen-reader result.
- **Negative: both Dialog and Select initially open in SSR.** After the popup
  remount, the first simulated Escape closes both layers rather than only the
  child. That path fails the desired layered-dismissal contract and is not
  supported by this experiment.
- **Negative: nested theme and overrides.** The trigger's inner opposite theme
  and custom accent ancestor no longer contain the popup after relocation. Only
  the outer theme ancestry survives. No computed color is claimed.

The experiment does not cover selection callbacks, dynamic option updates,
canceling an in-flight relocation, other framework portal implementations or
actual positioning coordinates. Focus observations are simulated requests, not
proof of real focus continuity across the popup remount.

## Promotion gates

Before changing default behavior, a supported design must preserve the complete
nearest-theme contract, resolve SSR/portal lifecycle and focus continuity, and
be implemented/tested with each framework's own portal mechanism. It must then
pass browser tests for scroll/resize, zoom, narrow viewports, pointer and touch,
keyboard/Tab order, focus return and assistive technology. Existing limitations
in [delivery status](./ready-delivery-status.md) remain in force.

No new portal option, theme bridge, dependency, deployment or production release
is introduced by this experiment.
