# Gallery parity repair

The previous gallery copied Destyler Basic examples and recolored them. Restoring an original shadcn reference card did not make those examples equivalent. This revision adapts the default example structure, text, state feedback and stylesheet to the pinned reference instead.

## Changed

- Preserve the original shadcn sources and the explicit coverage: 32 direct families, Clipboard composition, and 13 families without an official equivalent.
- Match default controls, label order, content and selected-state feedback across React, Vue, Solid and Svelte. Use real Destyler primitives, not native substitutes counted as missing components.
- Use the pinned Zinc tokens and common centered preview canvas. Adapt control geometry, borders, states and overlays to the reference.
- Restore the continuous gallery grid and exact-source file tabs, syntax coloring, copy, download and GitHub links. Source coloring preserves the original bytes.
- Use a permanent inline Calendar with controlled focus, month/year navigation and selected-date feedback rather than comparing a date-input popover to an always-visible calendar.
- Fix Vue pagination events and Progress model binding. Clipboard feedback waits for actual resolution and reports failure.

## Acceptance limits

This is a default-example adaptation, not a claim of complete API or behavioral equivalence. The 13 missing reference families remain explicitly labeled. Source contracts, types, builds and simulated DOM tests cannot prove rendered geometry, native keyboard/focus/pointer behavior or assistive-technology accessibility. Real-browser visual acceptance remains pending.

No upstream vendor files, production deployment, published UI/core package or original root Switch/Dialog page is changed. Work remains on the existing draft PR and Preview only.

## CSS integration correction (2026-11-08)

The earlier revision still loaded a separately adapted Basic stylesheet into every
native frame. It did not load the existing CSS-only package for Switch/Dialog.
Some high-specificity Basic rules also overrode the later shadcn adaptations, and
Calendar used native dropdown chrome and text arrows rather than the reference
caption structure. Equal theme tokens did not establish equal styling.

- Switch/Dialog now await a separate stylesheet entry that imports the unchanged
  `packages/css-only/styles.css`. Their frames never load the Basic fallback sheet.
  The small composition sheet supplies the isolated reset/canvas and the reference
  example's explicit outline-button variant, header/footer and icon close button.
- Other families keep Basic rules in a lower cascade layer. Explicit reference
  adaptations now win over old specificity. Dark buttons, Tabs hover, centered
  wrappers and Slider label typography have direct regression contracts.
- Calendar keeps native selects and public state callbacks, but overlays them on
  visible caption labels with matching SVG glyphs. No fake dropdown interaction.
- The Code view exports the actual selected CSS: package plus composition for the
  two existing package families, and the adapted shared sheet for other families.

These changes fix known source/integration errors, not an assertion of complete
visual parity. Browser rendering, focus/pointer behavior and assistive-technology
acceptance remain open; the remaining families are still adaptations rather than
exports of the two-family package.

## Gallery browser acceptance preparation

The dedicated [gallery browser plan](gallery-browser-acceptance.md) now targets
the actual `/components/` iframes for Checkbox, Tabs and Calendar. Its runner is
prepared and syntax/helper-tested only; it has not been run in this executor.
The earlier `/css-only/` browser suite is not substituted for this gallery check.

## State corrections (2026-11-09)

- Checkbox now maps its real hidden-input focus-visible state to the reference's
  ring/border and puts disabled opacity on control/label rather than the ancestor.
  The prior group opacity already produced about 50% overall; this is an explicit
  part-state mapping, not a claim that a double-opacity bug had been observed.
- Tabs uses the pinned dark inactive text, selected surface and focus ring/outline.
  The generic forced 2px focus outline no longer overrides these three families.
- Calendar no longer hides outside-month cells. Day/navigation state styling is
  adapted, and visual focus follows actual DOM focus rather than persistent
  `data-focus`, which is the native roving-tabstop date even after blur.
- The reference application demo now derives its today marker from the current
  UTC day, matching native Calendar's default timezone instead of freezing Nov 6.
  The pinned upstream shadcn component files are unchanged.

## Outside-day selection opt-in (2026-11-10)

The four gallery Calendars explicitly enable `allowOutsideDays` using UI 0.0.5
and core Calendar 0.3.5. Outside-month dates are visible and selectable, as in the
reference example. The library default remains false; this is an example-level
opt-in, not a CSS override or a change to every consumer's behavior. The existing
2020–2030 min/max limits remain, and the upstream disabled/unavailable checks
still apply. The gallery does not introduce disabled/unavailable fixtures.

The four framework simulated-DOM checks exercise actual outside-date selection
and the selected-date status. These are not native browser interaction results.

The browser runner's selected/focus/blur/disabled and four-sided border coverage
has been expanded, but remains unexecuted. Source and simulated-DOM results are
not a rendered-state or assistive-technology approval.
