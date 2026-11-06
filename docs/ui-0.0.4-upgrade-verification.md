# UI 0.0.4 dependency upgrade verification

Verified 2026-11-06 UTC in an isolated cloud checkout. This is an unpublished local dependency-upgrade candidate, not a deployment or browser-acceptance certificate.

## Baseline and changes

- Baseline: remote `destyler/designs` main commit [`fc09a25c3c8efada3106885bdaff6add57f48022`](https://github.com/destyler/designs/commit/fc09a25c3c8efada3106885bdaff6add57f48022), rechecked before this work.
- All four published `@destyler-ui/{react,vue,solid,svelte}` dependencies are pinned exactly to **0.0.4**, upgraded from **0.0.1-beta.21**.
- All **72** installed `@destyler/*` core packages resolve to **0.3.4**, upgraded from **0.3.2**. No extra direct core dependencies or dependency overrides were introduced.
- The lockfile changes only the root dependency record, four UI package records and 72 core package records. No unrelated package versions changed.
- The existing Astro host, five-panel layout, pinned reference, component examples, styling sources and test assertions are unchanged. Runtime third-party notices were regenerated, and current README dependency descriptions were updated.
- This checkout preserves the remote Switch/Dialog CSS-only scope and its earlier examples. The separate 46-family/184-example v7 candidate was unavailable in the restored workspace. This work neither restores nor replaces that candidate, and does not claim its broader coverage.
- No push, merge, deployment, package release, user-computer access or browser operation was performed.

## Environment and installation

Node **24.22.1**, npm **11.9.0**, Linux. Published UI 0.0.4 requires **Node >=22.22.3**. A clean `npm ci --no-audit --no-fund` succeeded with the final lockfile. Installed UI/core manifests were compared with lockfile entries. Writable temporary npm/config directories were used without changing permissions or accessing denied paths.

## Passed checks

All checks below ran against the updated dependencies after the clean install. Exit codes and logs are retained in the accompanying verification bundle.

| Check | Result |
| --- | --- |
| `npm run build` | Full production Astro, legacy, vanilla-extract and CSS-only builds passed |
| `npm test` | **42 passed**, zero failures, zero skips |
| `npm run check` | JavaScript syntax checks passed |
| `npm run check:types` | Existing framework consumers passed; Svelte zero errors/warnings |
| `npm run check:css-types` | Current four-framework consumers passed; Svelte zero errors/warnings |
| `npm run check:astro` | **14 files**, zero errors/warnings/hints |
| `npm run test:dom` | Existing React/Vue interactions and built Astro HTML checks passed |
| `npm run test:designs` | Packed style distribution checks and **16/16** styled/unstyled SSR/hydration cases passed |
| `npm run test:designs:panels` | **8/8** actual Panel SSR/hydration cases passed |
| `npm run test:css` | Packed CSS/offline style install, four framework builds, **8/8** native SSR/hydration cases and **4/4** UnoCSS combined builds passed |
| `npm run test:showcase:rendering` | **8/8** actual Showcase SSR/hydration cases passed |
| `npm run test:showcase:dom` | Built host hydration, controls, themes, source panes and iframe-node retention passed |
| `git diff --check` | Passed |

The source and DOM checks include the preserved legacy Tabs/Checkbox comparison as well as the Switch/Dialog consumers. SSR processes have no browser globals; hydration checks use Happy DOM and retain the original server nodes. Actual Panel/Showcase cases also cover repeated Dialog open/close, theme propagation and portal cleanup. Their captured runtime warnings/errors were empty.

The offline temporary consumers isolate the **packed styling artifacts**. Framework builds and SSR/hydration tests use the repository-installed UI/framework packages. They must not be described as independently installed framework applications.

## Known limits and retained warnings

- **No real-browser acceptance was run.** The earlier Chromium socket operation was denied even after approved escalation; it was not retried or bypassed. All browser scripts and the socket-based `test:http` command were left unrun.
- Happy DOM is not a rendering engine. These passes do not establish visual parity, responsive geometry, browser focus trapping/return, actual keyboard/assistive-technology behavior, pointer/touch interaction or cross-browser compatibility.
- Host DOM checks simulate iframe readiness and disable actual iframe loads. Genuine document handshakes and browser Back/Forward still need browser acceptance.
- Historical screenshots and beta.21 browser results are not evidence for UI 0.0.4.
- The existing nonfatal `@internationalized/date` default-export warning remains in builds. Existing large-chunk warnings remain; no performance improvement is claimed. Installation also reports the existing deprecated `tsconfck` package and an npm proxy-configuration warning.
- No new all-family suite was reconstructed, and no v7 test result is claimed.

## Reproduction

Use the supplied lockfile with Node >=22.22.3, run `npm ci`, then the commands in the passed-check table in order. Build before the unit tests so built-output assertions cannot skip. Do not run browser commands in a denied environment. Preserve separate reporting for any later real-browser or assistive-technology acceptance.
