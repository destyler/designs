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
