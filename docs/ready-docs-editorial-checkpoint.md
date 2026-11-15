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
