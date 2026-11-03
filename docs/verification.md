# Verification · 2026-11-03

## Deployed code

- Repository: `destyler/designs`, branch `prototype/cloud-scoped-themes`.
- Code commit: `2410c2b5fca00f0495243215bda8ae62230ea285`.
- Vercel project: existing `destyler-designs-prototype` only.
- Deployment: `dpl_B4DmwuWwzHg4FfqTPEykUbJ5j4G6`, **READY**.
- Verified live URL: https://destyler-designs-prototype.vercel.app/
- Vercel built the exact commit using `npm ci` and `npm run build` (19-second build).
- No main-branch merge, npm release, or user-computer access.

## Automated cloud checks

- 18 Node source/contract/legacy tests: passing.
- JavaScript syntax and TypeScript/Vue checks: passing.
- Production Vite build: passing.
- Production bundle in Happy DOM: reference, React and Vue mount; switch and tab state changes pass. This is not a visual/browser test.
- Legacy HTTP route smoke: passing.
- GitHub reported no check-runs attached to the code commit. The checks above were run in the cloud workspace, not a claimed GitHub CI pass.
- Build warnings remain: the published Destyler aggregate export references a non-exported default in its date dependency; the comparison bundle is large because it includes both frameworks and the reference. No date component is used in this slice.

## Live cloud-browser verification

Checked the deployed site in the supported cloud Chrome browser, with real input and read-only computed-style inspection:

- All three columns render and use the expected accessible controls.
- Marketing switch and tips checkbox respond to Space; the dialog reflects their actual state (`Marketing: on · Updates: on · Tips: off`).
- Left/Right keyboard navigation selects the appropriate tab in all three implementations.
- Disabled controls are disabled. The disabled checkbox label's opacity is `0.5` in all three implementations.
- Repeated dialog opening, Done, and Escape work. After waiting for the exit animation, dialogs are hidden and focus returns to their own trigger.
- Light Card height was 377 px; radius 14 px. Background, text, border and shadow match across the three columns. Equal-width grid fractional rounding differs by at most 0.016 px.
- Switch width is 32 px and height 18.3906 px in all columns; Tabs list height is 36 px and radius 10 px.
- Dark Card background is `oklch(0.21 0.006 285.885)`, foreground `oklch(0.985 0 0)`, border `oklch(1 0 0 / 0.1)` in all three columns.
- Each dialog is outside `#app` in a body-level portal. Dark dialog background is `oklch(0.141 0.005 285.823)`, width 512 px, radius 10 px in all three implementations.
- Switching only the Vue column to dark leaves both other columns light.
- No application-source console errors appeared in the inspected log set. Browser-extension metadata errors were excluded explicitly.
- Full-page light/dark comparison screenshot inspected and saved as a task artifact.

## Limits

Local headless Chromium could not launch because this execution environment denied IPC socket creation (`Operation not permitted`), including one sandbox-external attempt. The live checks above were instead performed in the supported cloud-browser service, with no user-computer access.

`scripts/test-shadcn-browser.mjs` contains repeatable Playwright coverage, including a 390 px viewport check. That standalone suite and its mobile viewport test were **not run** here because of the local launcher limitation. Desktop appearance and listed live interactions were verified manually through browser automation. No claims of mobile, screen-reader, full accessibility, cross-browser, SSR/hydration, pixel-perfect screenshot diff, or full-component coverage are made.

This slice covers React and Vue only, default variants of Tabs/Switch/Checkbox/Dialog, plus presentational Card/Button. It is not a four-framework implementation or complete shadcn migration engine.
