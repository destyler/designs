# Unified four-framework comparison · 2026-11-04

The current pass revisited actual cloud Chrome screenshots of [shadcn Switch](https://ui.shadcn.com/docs/components/base/switch) and [Base UI Switch](https://base-ui.com/react/components/switch). Their restrained navigation, concise headings, clear example boundaries and file controls informed the arrangement. No brand or layout assets were copied.

The user's intended hierarchy is now explicit: the original shadcn panel is fixed on the left; framework choice and mutually exclusive Preview/Code controls belong to the Destyler panel on the right. All four frameworks show real published primitives and the same compiled design CSS. The old two-framework comparison is retained separately, rather than silently relabelling its simulated coverage.

Only completed Switch and Dialog adapters appear in the component navigation. Scoped, independent preview canvases keep framework CSS from affecting the reference. At narrow widths, the panels stack and all controls remain available. Technical caveats stay in the collapsed notes and the verification report.

---

# Component lab visual study · 2026-11-04

The previous redesign did not meet the user's visual bar. This pass began with actual cloud-browser visits and screenshots, rather than relying on remembered documentation layouts.

## References actually inspected

- **Current site:** https://destyler-designs-prototype.vercel.app/ — pale green chrome, excessively small metadata, several competing layers of explanation, and a preview disconnected from its code view. The hierarchy looked like a test dashboard rather than a deliberate component library.
- **shadcn Switch:** https://ui.shadcn.com/docs/components/base/switch — concise title, restrained navigation, direct provider choices, and a single generous example/source region. The example has a clear visual boundary; supporting text does not compete with it.
- **Radix Themes Switch:** https://www.radix-ui.com/themes/docs/components/switch — confident type scale, a short useful description, clear source links, consistent alignment, and visibly distinct preview/code surfaces. Its compact example demonstrates that generous spacing does not mean making everything enormous.
- **Base UI Switch:** https://base-ui.com/react/components/switch — quiet side navigation, focused example, source-file tabs inside the example container, and code disclosure that belongs to the component. This was the strongest reference for the user's latest Preview/Code correction.

## Applied design system

The new shell uses self-hosted Geist Variable, a neutral ivory/charcoal palette, one restrained orange brand accent, a 224 px library rail, and a 52 px maximum component heading. A shared baseline and measured spacing connect the title, view tabs, framework selector and comparison canvases. Active navigation is legible, dark, and distinct rather than a low-contrast green wash.

The two live implementations get equal canvases, identical inset demo cards, clear Original/Adapted labels, and much less explanatory chrome. The subtle dotted backdrop separates the example from its surrounding page without recoloring the actual shadcn/Destyler component tokens. The orange three-bar mark is original artwork; no reference site's logo or layout assets were copied. The Geist font's OFL notice is shipped with the site.

**Preview and Code are mutually exclusive tabs in the same workbench.** Switching to Code hides the preview while preserving its mounted state. Code starts with the selected component's real React or Vue source excerpt, derived from the actual adapter file and labelled with source line ranges. Tokens, component classes, and the exact applied CSS remain available in the same area. There is no detached code section or auto-scroll jump.

Mobile keeps the same hierarchy, replaces the library rail with a horizontal component picker, and stacks the two comparison canvases. React/Vue support and missing Solid/Svelte support remain explicit. Framework, source and theme controls remain reachable.

## Visual validation

Desktop and 390 px browser viewport evidence, corrections, deployment identity and limits are recorded in `verification.md`. The actual reference sources and generated recipe hashes remain unchanged.

---

## Previous study (historical)

### Component showcase redesign

Reviewed 2026-11-03 in the cloud browser, including actual screenshots of each page. This is visual research, not copied branding or a claim of pixel equivalence.

## Pages reviewed

- https://destyler-designs-prototype.vercel.app/ (previous production): the large introduction and two fully nested settings fixtures delayed the components below the first screen. Supporting engineering detail competed with the preview.
- https://ui.shadcn.com/ : restrained navigation, a clear hierarchy, and composed live examples rather than an engineering dashboard.
- https://ui.shadcn.com/docs/components/switch : persistent component navigation, focused title and description, one centered example, source available alongside the preview.
- https://base-ui.com/react/components/checkbox : quiet sidebar, generous preview space, adjacent implementation files and minimal supporting chrome.
- https://www.radix-ui.com/ (redirected from /themes): purposeful type hierarchy, a concise introduction, and live examples separated from technical explanation. The expressive brand treatment is not copied.

## Applied decisions

A component documentation layout replaces the landing-page/test-fixture layout. Switch, Checkbox, Tabs and Dialog each have a focused comparison. Settings remains a composed block. The active item is encoded in the URL hash, with back/forward navigation supported. A compact toolbar groups framework and color-mode controls. The preview has equal-width source-backed implementations and restrained origin labels. Technical details sit below the preview and in an expandable section, while framework support remains visible.

The shell uses a restrained green-gray neutral palette, a small original typographic Destyler mark, consistent spacing, and a horizontal component picker at phone widths. No third-party brand mark or design asset was copied. The actual demo tokens, extracted recipes and vendored source remain unchanged.

The source inspector displays raw files, real recipes and the applied stylesheet. It follows the selected component when its recipe view is used. Only React or Vue mounts on the Destyler side. Solid and Svelte are explicitly unimplemented. Component selection resets both selected examples; framework selection resets only the Destyler example.
