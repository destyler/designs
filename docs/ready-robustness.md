# Ready: dynamic state regression checks

## Defects reproduced

- Dialog descriptions added while the dialog was already open were not associated
  through `aria-describedby`. The primitive checks rendered description nodes when
  opening, not on every content update. The Ready wrapper now owns the optional
  description association, including removal, without changing core/UI packages.
- In React, a parent clearing Select from `a` to `''` changed the visible value to
  the placeholder but left the hidden select and `FormData` submitting `a`.
  Reconciliation ran before the primitive finished updating its hidden options.
  React now defers and cancels stale effect reconciliation and observes local
  child-list updates so later-created hidden options are also reconciled. The
  observer does not watch the selected attributes it changes, and disconnects on
  cleanup. Solid explicitly tracks
  the effective value and defers until its reactive DOM update completes.

## Coverage

`node --test test/ready-accessibility.test.mjs test/ready-select-clear.test.mjs`
compiles real React, Vue, Solid and Svelte components and executes them in Happy
DOM. Assertions cover disabled controls, ARIA reference targets, modal/title
semantics, optional descriptions added and removed while open, a parent refusing
an open request, and parent-driven Select clear/reselect sequences checked against
native hidden values and `FormData`. Existing reset and two-theme tests remain
part of `node --test test/ready-*.test.mjs`.

These tests establish DOM/state contracts, not screen-reader output, actual
browser form behavior, rendered contrast, focus trapping or pixel equivalence.
No browser acceptance, production deployment or upstream package release is
implied. Inline overlay clipping/stacking restrictions remain unchanged.

## Dialog keyboard and disposal regression checks

`node --test test/ready-keyboard.test.mjs` exercises all four adapters in Happy
DOM, using a Select composed inside the Dialog body. This audit found no new
implementation defect in the checked cases; this batch adds regression coverage
only, without changing components or underlying packages.

The assertions cover:

- Opening requests focus inside the dialog; closing via Escape or Close requests
  focus back to the initiating trigger.
- Escape during IME composition does not dismiss the dialog.
- With the inner Select open, the first Escape closes only that Select; the next
  Escape closes the parent Dialog.
- Unmounting an open Dialog restores body `pointer-events` and `overflow` and the
  background element's original `aria-hidden` state.
- A newly mounted Dialog subsequently opens, handles Escape, and restores focus,
  guarding against stale dismissable layers or focus traps left after disposal.

Focus assertions observe simulated `.focus()` requests and Happy DOM's active
node, not a browser's full focus navigation. No geometry is mocked or injected.
These tests do not establish native Tab/Shift+Tab order, layout-based tabbability,
real-browser focus trapping, screen-reader behavior, or general nested-overlay
support. The inner Select case is one explicit composed-body regression, not a
claim that arbitrary nested modal stacks are supported.

## Select test readiness

React can commit the hidden Select before the adapter's passive reconciliation
effect is installed. Instrumentation at the first committed Select observed no
adapter observer and no selected reset-default attribute; both appeared after
settlement. Therefore a fixed 100ms delay is not a reliable readiness condition
under test load. The Select clear regression now waits up to two seconds for the
complete visible-value, native-value, FormData and reset-default invariant,
retaining every assertion and reporting the failing assertion at the deadline.
It also waits for observer cleanup on unmount. This is a test scheduling fix,
not relaxed correctness criteria or a new browser-verification claim.
