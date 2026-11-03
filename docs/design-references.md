# Component showcase redesign

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
