# Restore original shadcn comparisons to the full gallery

This local follow-up starts from the saved full-gallery commit `a7a793c50df070ec092e5e2c5c6efa8a68f48b4b` (designs PR #2). The first gallery reconstruction omitted the original shadcn reference even though the project's documented layout requires an original reference first, followed by four simultaneous framework implementations. This change restores that comparison. It is not a recovery of the earlier v7 candidate.

## Scope and provenance

- The `/components/` page has a first, full-width shadcn/ui reference and the existing React, Vue, Solid and Svelte cards below it. Search, family fragments, independent/global themes, Preview/Code tabs and isolated frames remain available.
- All 184 existing Destyler examples remain intact on UI 0.0.4/core 0.3.4. The original `/` comparison is preserved.
- The reference uses the same pinned upstream commit as the original comparison: [shadcn-ui/ui 4aaea19](https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui).
- The original seven upstream UI files are untouched. Twenty-nine additional original UI files are vendored byte-for-byte, with SHA-256, Git blob hashes, exports and imports in `docs/shadcn-gallery-sources.json`. Original MIT attribution is retained.
- Seven additional direct dependencies use exact versions from the same upstream commit's `apps/v4` lockfile importer. The lock adds 15 packages without changing any existing package version.
- The reference has its own Tailwind/Zinc stylesheet and document. It does not load Destyler's demonstration theme. Source tabs contain the selected application example, original vendored dependencies, utilities and reference CSS, exported from the files actually built.

The application-authored examples compose untouched upstream components. The Combobox example replaces the convenience wrapper’s unnamed icon actions through supported composition: the original exported Trigger receives an accessible label, and an original Button provides explicitly labeled controlled clearing. Vendor bytes and DOM are not patched. They are not represented as copies of official shadcn documentation demos. A direct counterpart means the same component family, not identical anatomy, APIs, interaction, accessibility or appearance.

## Coverage

The complete per-family explanations and source links are in `examples/all-components/shared/shadcn-coverage.json` and appear in the page for the selected family.

- **32 direct counterparts:** aspect-ratio, avatar, breadcrumbs, calendar, carousel, checkbox, collapse (Accordion), collapsible, combobox, dialog, field, fieldset, hover-card, label, menu (DropdownMenu), navigation-menu, otp-input, pagination, popover, progress, radio (RadioGroup), scroll-area, select, separator, slider, splitter (Resizable), switch, tabs, toast (Sonner), toggle, toggle-group, tooltip.
- **1 explicit application composition:** clipboard, using an original shadcn Button and the browser Clipboard API. It is not an official Clipboard primitive.
- **13 absent specialized counterparts in the pinned registry:** color-picker, dynamic, edit, file-upload, floating-panel, number-input, presence, qr-code, signature, steps, timer, tour, tree. Each has an informative absence state rather than a native-input or static-markup imitation. The four real Destyler examples remain available.

The pinned Progress wrapper uses its value for the visual transform but does not forward it to the Radix root. The application example supplies explicit ARIA percentage values; the unchanged original root/indicator still expose an indeterminate data-state. This upstream limitation is disclosed rather than presenting the reference as a fully equivalent determinate state machine.

Absence is scoped to the inspected pinned official registry, not every future release or third-party/community registry. In particular, a native file input is not a FileUpload/dropzone state machine, an image is not QR generation, and a generic Popover is not a floating-window lifecycle.

## Reproduction

Use Node >=22.22.3 and the supplied lockfile:

```sh
npm ci
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm test
npm run check
npm run check:types
npm run check:css-types
npm run check:all-components
ASTRO_TELEMETRY_DISABLED=1 npm run check:astro
npm run test:all-components
```

The new frame is `/all-components/shadcn/?component=checkbox&theme=dark`. The complete gallery remains `/components/`. Serve the entire `dist/` directory at the origin root. Code exports are example/source references, not complete separately installed projects.

The all-component aggregate includes the reference's server rendering and Happy DOM checks alongside all 184 Destyler cases, source/asset/style checks and the five-card host suite. A rendered absence message is not counted as an implemented shadcn component. Radix may intentionally remove hidden form-bubbling helper controls after mounting outside a form; reference evidence records these permitted lifecycle changes separately from retained visible controls instead of claiming that every server node survives.

## Verified results (2026-11-06 UTC)

The final clean-install pass completed all ten commands successfully: offline `npm ci`, full production build, 57 unit tests (zero failures/skips), syntax, existing framework types, CSS-consumer types, five-frame/gallery types, Astro checks (44 files, zero diagnostics), the complete component aggregate, and staged whitespace checks. The seven preserved regression commands also passed: all-frame types, legacy DOM, style-package rendering, Panels, CSS/UnoCSS consumers, Showcase rendering and Showcase host DOM.

The component aggregate passed all nine stages. This includes 184 unchanged Destyler SSR/hydration cases and 46 reference SSR/hydration states, explicitly split into 32 direct counterparts, one Clipboard composition and 13 absence messages. The reference suite captured React, global/window console, window errors and rejected promises through cleanup with no recorded warnings/errors. It also passed five actual query-parser/mounted-readiness cases. Legitimate Radix form-helper removals are reported, not hidden by a claim that all server elements survive.

The rebuilt five-card host suite passed 27 checks, including all 46 routes/source links, independent and global themes, keyboard tab controls, strict message validation, stale source responses, HTTP/JSON/schema failure and retry, clipboard rejection and disposal during pending fetches. These host iframe/network events are simulated; real document-to-document readiness remains a browser acceptance item.

Built-source checks matched all 184 Destyler source sets (205 file entries) and 46 reference source sets (308 file entries) byte-for-byte. Eighteen reachable built assets were found without missing or external dependencies. The reference production CSS stayed identical when unrelated verification-only Tailwind classes were introduced, and the final clean build reproduced that CSS hash.

Independent review verified the complete pinned upstream inventory, all 36 original UI source hashes, coverage truthfulness, supported component APIs, named Combobox composition, source/style isolation and accurate test limitations. No blocking implementation issue remains within this local validation scope.

## Limits and publication

Real-browser visual, responsive, native keyboard/focus, pointer/touch, clipboard/file/download permission and assistive-technology acceptance remain pending. Happy DOM does not provide those guarantees. The earlier denied browser operation has not been retried or bypassed. Existing date-export and large-bundle warnings remain visible.

Publication is limited to updating draft PR #2 and creating a new Preview after explicit authorization. The gallery is not merged into main, the production site is not replaced, and access protection is unchanged. Exact commit and deployment status are recorded on the PR. A Preview build marked READY establishes successful deployment, not browser acceptance.
