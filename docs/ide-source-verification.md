# IDE source inspector verification · 2026-11-04

## Published result

- Application commit: `8993494c88d275e3168bf639b0065b4ace3ae35e` on `main`.
- Production: https://destyler-designs-prototype.vercel.app/
- Deployment: `dpl_6fZNUbygHPXnjzfNwdYJwoLwXyDQ`, READY, expected commit, existing public alias, no alias error.
- The connected GitHub API published the tested tree `153b022fc383d07d5561e2e674863fcb80b31c53` with a non-force, expected-head update. The shell had no GitHub push credentials; no credentials or access settings were changed. The cloud checkout was aligned only after verifying identical trees.

## Changes

The right-hand Code view is a read-only IDE: horizontally scrollable filename tabs, full path, syntax coloring, separate line-number gutter, file metadata, copy, and source/download actions. ArrowLeft/ArrowRight wrap between files; Home/End move to the first/last file. Selected file and the mounted live preview survive Preview/Code changes. The fixed shadcn reference is unchanged.

Six actual files are shown: the selected framework's complete Showcase adapter (which contains both Switch and Dialog), vanilla-extract definitions, generated CSS, generated JavaScript exports, shared data, and demo layout. No snippets are reconstructed. Generated files are marked and downloaded, rather than incorrectly linked to ignored GitHub `dist/` paths.

The generated package artifacts are:

- `styles.css`: 5,500 bytes; CSS rules, variables and generated class selectors.
- `index.js`: 712 bytes; class, theme and CSS-variable string exports. No styling runtime.
- Type declarations also remain in the package distribution, but are not a source-inspector tab.

## Automated checks

- 31 Node tests pass.
- TypeScript, Vue, Solid and Svelte checks pass; Svelte reports no errors or warnings.
- Full build passes for the host and all four consumers.
- Both production-bundle Happy DOM suites pass. New assertions cover exact source/copy bytes (including final newlines), separate line numbers, six tabs, generated actions, focus/roving tabindex, selected-file persistence, framework source paths and preserved reference state/theme.
- JavaScript syntax, eight HTTP smoke routes and `git diff --check` pass.
- GitHub reports no commit statuses. Local tests are not a claim of GitHub CI success.

## Actual cloud Chrome checks

- Desktop screenshots reviewed with React code and an independently dark shadcn reference.
- React, Vue, Solid and Svelte preview switches respond to Space. Each framework's Code path/import matches its actual adapter. Left switch state and theme survive right-side changes.
- All six file tabs display source; clipboard readback matches displayed text after the asynchronous copy completion state. An immediate first read before completion was stale, then passed after awaiting `Copied`.
- ArrowLeft/Right wrapping and Home/End move selection and actual focus. Computed focus outline offset is `-3px`; selected offscreen tabs scroll into view.
- Both generated downloads exactly match the local built files by SHA-256:
  - CSS: `fcb5fa965fb691f50e91a3a746357ba532f16777213e7305f26ce7e640e0f023`.
  - JavaScript: `7633acde655c09293cfbb46a58c2a505e07595251bc88311adf503540a526feb`.
- All four framework Dialog previews open, close with Escape and restore trigger focus.
- The existing 390px verification iframe was inspected with source and minified generated CSS. Inner page `scrollWidth === clientWidth === 375`; long lines scroll inside the editor. Tabs remain keyboard-accessible with visible focus.
- No application-origin errors were present in the inspected browser error log. Browser-extension metadata errors are unrelated to the application.

## Limits

Chrome only. The 390px check is a real narrow iframe, not physical-touch testing. Safari, Firefox and screen-reader certification were not performed. Standalone Playwright cannot launch Chromium in this shell due to IPC restrictions; actual browser evidence comes from cloud Chrome. Existing bundle-size and upstream optional date-export warnings remain. No npm release or user-computer access.
