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
