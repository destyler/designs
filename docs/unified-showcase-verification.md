# Unified showcase verification · 2026-11-04

## Delivered application

- Public site: https://destyler-designs-prototype.vercel.app/
- Application commit on `main`: `b3c6c9752bf24de8edb3261ee465269da6f8f4a1`.
- Vercel deployment: `dpl_HVQZXgmidWiUAKY8p4M5h7kT2dZL`, production, READY, with the existing public alias assigned and no alias error.
- Remote `main` was fast-forwarded from its verified original `2d0b4eb` through the complete PoC history. No force push or other contributor's changes were discarded. The remote tree `6053673bbaef2240fb5b27d66b8238f4cb2386bf` matches the locally tested application tree.
- GitHub reports no commit status checks. Local validation is not a claim of GitHub CI success.
- The earlier React/Vue comparison at `/examples/shadcn/`, all four style-engine PoC routes and the older scoped-theme examples are retained.
- No npm release, user-computer access, credential change or permission expansion.

## Scope and implementation

The root now shows only completed **Switch and Dialog** adapters. Its left panel is the pinned original shadcn/ui implementation, on React/Radix. Its right panel uses the actual published React, Vue, Solid or Svelte Destyler primitives and the same precompiled vanilla-extract style package.

The framework selector changes only the right consumer. Preview and Code are mutually exclusive inside the right panel; the reference stays visible and mounted. The source view imports actual adapter and style files with `?raw`, including the exact 5,500-byte package CSS instead of the full host stylesheet. Full adapter views explicitly say they include both Switch and Dialog.

The four consumers use isolated same-origin iframes. Dialog portals are created under the consumer document's body and receive explicit theme classes. **A Destyler modal is therefore contained within its preview canvas**, while the original shadcn modal uses the host document. This is a deliberate demonstration boundary, not a claim that modal geometry or page-wide modality is identical.

## Checks passed

- 30 Node tests, including upstream source provenance, selector contracts, supported component scope, exact live source imports and message origin/source checks.
- TypeScript, Vue, Solid and Svelte checks (Svelte: zero errors/warnings).
- Full production build: host application and all four independent consumers.
- Legacy and new production-bundle Happy DOM suites. New assertions cover reference node identity/control state/theme, all four framework selections, source bytes, framework changes while Code stays open, exclusive views, tab key handlers, independent themes and URL-hash navigation.
- Four actual Showcase adapter DOM checks: controlled Switch and live count; disabled state; rejecting wrong-origin messages; component/theme updates; themed body portals; Dialog open/close/reopen; state retention and unmount cleanup. Temporary test harness remains in ignored build artifacts.
- Existing eight real Panel SSR/hydration checks rerun successfully. These are the original PoC Panel tests, **not an SSR certification of the new host showcase**.
- JavaScript syntax, eight legacy HTTP routing checks and `git diff --check`.

## Actual cloud Chrome review

The deployed application, not a localhost substitute, was inspected through cloud Chrome. shadcn and Base UI reference pages were also visually reviewed before implementation.

- Desktop screenshots inspected for default Switch, a dark fixed reference beside Svelte Code, and dark Dialog.
- Left Marketing switch was enabled and its theme set to dark. Those state/theme values survived React → Vue → Solid → Svelte and right-side Code switching.
- All four real right-hand switches toggled with Space and updated their count to three. Disabled security controls remained disabled.
- Code switched to the correct React, Vue, Solid and Svelte file. Compiled CSS showed the standalone 5,500-byte package. Copy displayed success; an independent clipboard readback is not claimed.
- React, Vue, Solid and Svelte Dialogs opened with dark portal tokens. Tab remained within the dialog, Escape closed it and focus returned to its trigger. Done and settled reopen flows were exercised. One rapid Solid reopen attempt during the closing transition required a settled retry; no application error was observed.
- Original shadcn Dialog closed with Escape and restored focus.
- Browser Back restored Switch and Forward restored Dialog.
- No desktop page-level horizontal overflow.

## Narrow viewport

The same live root was tested in the preserved 390px responsive iframe page. Its content width was 375px after the scrollbar; the panels were 335px wide, and the isolated consumer viewport was 333px.

- Preview and Code screenshots were inspected; both had `scrollWidth === clientWidth === 375` for the host page.
- All four framework consumers had `scrollWidth === clientWidth === 333`, and their Switch controls responded to Space.
- Keyboard component navigation and a dark Svelte Dialog were verified. The settled modal was 301px wide with 16px horizontal margins inside its 333px consumer, and Escape restored focus.
- The cloud browser's coordinate-based nested-frame navigation clicks were unreliable while scrolled; the exact links worked via keyboard activation. This is not a physical-touch or pointer certification.

## Limits

- Browser review is Chrome only. Safari, Firefox, physical touch, assistive-technology certification and exhaustive accessibility auditing were not performed.
- Standalone Playwright CLI was not rerun because the preceding PoC established this execution environment cannot launch Chromium due to IPC restrictions. Real-browser results above come from separate cloud Chrome.
- Existing upstream optional date-export and bundle-size build warnings remain. They are not new build failures.
- The integrated site is run locally with `npm run build` followed by `npm run preview`; the original Vite dev route and individual framework dev commands remain available as documented.
- This is a two-component client-rendered prototype. No claim of complete shadcn coverage, production package release, general SSR readiness or pixel-perfect equivalence.
