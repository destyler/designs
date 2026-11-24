# Ready docs editorial checkpoint (2026-11-15)

This is a local engineering checkpoint, not a visually accepted release.
Base: `a6db6a12ce253a702602d6912c22890c83e8a924`.

## Changes

- Replaced the decorative homepage cards, avatar stand-ins and fake component glyphs with an editorial title, concise introduction, real native Select example and linked component index.
- Homepage framework selection mounts the matching React, Vue, Solid or Svelte preview. Theme changes retain its iframe and current state.
- Dark is the default for new visits; saved light/dark preferences remain supported. Document appearance and preview theme remain independent.
- Narrow navigation, serif page titles, shared-border preview/code panels, readable text and responsive layout replace the previous rounded-card presentation.
- Preserved component APIs, examples, four-framework native preview build, search, keyboard navigation and documented limitations.

## Verification scope

- Mac mini, Node 24.14.0. No dependency changes.
- `npm run build:ready:docs`: passed, including docs TypeScript checking and 16 native preview HTML entries.
- Full `npm run test:ci`: 157 total, 156 passed, 0 failed, 1 artifact-dependent legacy test skipped. After `npm run build:designs`, reran `test/vanilla-extract.test.mjs`: 2 passed, including the previously skipped check, 0 skipped. This is a full suite plus targeted follow-up, not a second full suite run.
- Focused docs tests: 7 passed, 0 failed, 0 skipped.
- New assertions cover dark default, all four homepage native runtime URLs and iframe identity on theme changes.
- `git diff --check`: passed.
- Local HTTP smoke: homepage and Svelte Select returned 200 on port 4174.

## Still required

Real browser visual/interaction acceptance is pending browser permission. No screenshots or visual geometry were verified for this version. Do not treat simulated DOM tests or HTTP success as visual approval.

Check desktop and narrow mobile layouts, both document appearances, all four framework runtimes, open Select/Dialog clipping, keyboard focus, repeated framework/theme switching and search/navigation. Display typography currently uses a system CJK serif stack (Songti SC on macOS); cross-platform font consistency needs review. No publication or deployment was performed for this checkpoint.

## Local review follow-up (2026-11-16)

- Rebuilt the docs and reran the complete suite at `e33183a`: 157 passed, 0 failed, 0 skipped.
- Real-browser review on the Mac found that the Dialog preview cropped its bottom edge at a 390px viewport. Increased only the mobile Dialog iframe to 420px; other previews and desktop sizes are unchanged.
- After this correction, docs build/TypeScript and 7 focused docs regressions passed, with no skips. The full suite above predates the three-line CSS correction.
- Visual worker rechecked 390px React Everyday and Svelte Midnight Dialog: entire dialog and close button visible with bottom clearance, no prior internal-scroll clipping.
- Four-framework desktop Checkbox toggles and Dialog open/close were checked. Escape returned focus for React/Vue/Svelte; Solid close-button focus return was checked. Mobile Checkbox layout/Space toggling and mobile navigation were checked.
- This scoped review does not establish full keyboard, assistive-technology, cross-browser, nested-overlay, or cross-platform typography acceptance. No production deployment was performed.

## Documentation refinement (2026-11-16)

The owner found the earlier version improved but still visually unsatisfactory. This follow-up is an iteration, not a claim of owner design acceptance.

- Compact homepage brings the real native Select and its matching source into the desktop first screen. Code uses the existing byte-preserving tokenizer; copied and compiled examples share the same source.
- Documentation uses sans-serif reading typography, a unified preview/code/framework/theme toolbar and higher-contrast API content. Component theme remains independent from document appearance; the initial preview is the real Midnight theme.
- Actual screenshot review found clipped single-line source, offset mobile headings and undersized controls. Shared examples now use multiline attributes/options; mobile headings align with the reading edge; narrow example toolbars use readable three-row controls.
- Visual recheck of the final layout confirmed the desktop source no longer has the previous horizontal clipping, the 390px heading alignment is consistent, and narrow controls are readable without crowding. The code panel retains vertical scrolling. This scoped check is not user aesthetic approval or comprehensive browser/assistive-technology acceptance.
- Final local checks: docs build/TypeScript, 9 focused docs/source tests, 157 full regression tests (0 failed, 0 skipped), four-framework type checks, packed positive/negative consumer contracts and all four demo builds passed.
- Added assertions that basic shared examples retain readable line lengths and multiline component attributes. No dependency changes, package publication or production deployment.
