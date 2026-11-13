# Calendar outside-day selection upgrade (2026-11-10)

## Scope and dependencies

All four `@destyler-ui/*` dependencies are pinned to **0.0.5**. The 72 installed
`@destyler/*` packages resolve to **0.3.5**, including Calendar. Installed package
manifests match the npm lockfile; no local library patch or dependency override is
used. Normal npm resolution also updates transitive `@swc/helpers` from 0.5.23 to
0.5.24. The build regenerates third-party notices for the installed versions.

React, Vue, Solid and Svelte gallery examples explicitly enable
`allowOutsideDays`. The upstream default remains false. Existing 2020–2030
min/max bounds remain intact; the option does not bypass upstream disabled or
unavailable checks. Those constraints are not new gallery fixtures, and this
report does not claim new gallery interaction coverage for them.

## Verification

Executor: Elone-Mac.local, Node 24.14.0, npm 11.9.0.

- Published dependency installation succeeded with `npm install --save-exact`.
- Full `npm run build` passed.
- `check:all-components`, `check:astro`, `check:types` and `check:css-types` passed.
  Astro checked 44 files with zero errors, warnings or hints.
- `npm test`: **95 passed**, zero failures or skips. The original fixed-0.0.4
  dependency assertion was updated for the new intentionally pinned release.
- `npm run check` passed JavaScript syntax validation.
- `npm run test:all-components`: all nine stages passed, including 184 native
  SSR/hydration examples, 46 reference examples, semantic/style/asset checks and
  28 host interaction tests. All four outside-day simulated-DOM regressions passed.
- `git diff --check` passed.

The framework hydration suites call a shared simulated-DOM regression helper.
It finds a real rendered outside-month date, verifies enabled semantics, clicks
it, then checks both selected-date feedback and Calendar's selected marker. The
existing month/year, navigation and inside-day interactions remain in place.
Source contracts also require all four examples to retain the opt-in and bounds.

Existing upstream date-export and large-bundle warnings remain.

## Acceptance limits

No real browser was launched, no denied browser operation was retried, and no
new screenshots or browser/visual acceptance results exist. Happy DOM, types and
builds do not establish native keyboard/focus/pointer behavior, rendered geometry
or assistive-technology approval. The prepared browser plan remains pending.

This change stays on the existing draft PR. No merge, production deployment or
security/protection change is part of this upgrade.
