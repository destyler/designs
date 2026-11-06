# Additional gallery reference sources

The 29 additional UI files support the all-components comparison. They are
unmodified source from the same `shadcn-ui/ui` commit as the original seven
reference files: `4aaea19d9cff3e0908e12a8c1d504b8c5ec34610`.

[`../../docs/shadcn-gallery-sources.json`](../../docs/shadcn-gallery-sources.json)
records their upstream URLs, SHA-256 digests, Git blob hashes, byte counts,
exports, imports and exact additional dependency versions from the upstream
lockfile. It extends, and does not replace or alter, the original manifest.
The existing [MIT license](LICENSE) applies. All 36 local UI files were checked
against the Git blob hashes in the pinned upstream directory listing.

The same manifest preserves the full 62-file `new-york-v4/ui` directory
inventory. Claims about missing components are limited to that pinned
registry, not all shadcn versions or third-party community registries.

The gallery coverage manifest at
[`../../examples/all-components/shared/shadcn-coverage.json`](../../examples/all-components/shared/shadcn-coverage.json)
maps all 46 Destyler families: 32 direct counterparts, one explicitly
application-authored Clipboard composition, and 13 without an equivalent
upstream component. A direct counterpart is not a claim of matching APIs,
every behavior, accessibility or pixel parity. Examples and demo copy are
application-authored, not copied upstream examples.

Notable names and dependencies:

- Collapse maps to Accordion; Collapsible remains a separate family.
- Breadcrumbs maps to Breadcrumb; Radio maps to RadioGroup.
- OTP Input maps to InputOTP, Splitter to Resizable, and Toast to Sonner.
- This pinned registry includes a native Combobox using Base UI. It is not
  a Popover/Command replacement.
- Field and FieldSet are exports from `field.tsx`.
- Resizable requires the v4 Group, Panel and Separator API.
- Imports retain the upstream `cn` and `@/registry/new-york-v4/ui/*` paths;
  build aliases resolve them without modifying the source.

The original [`README.md`](README.md) describes the earlier seven-component
reference and its extracted Destyler styling recipes. Its historical scope
does not imply that the new gallery components use those extracted recipes.
