# Actual gallery browser acceptance plan

**Prepared, not run.** The restricted cloud executor did not launch a browser or
retry its previously denied browser operation. Syntax and pure helper/source
contract tests are the only new checks performed for this script. This document
is not a visual approval and does not replace remaining accessibility review.

The older `scripts/test-css-only-browser.mjs` visits `/css-only/` proofs. The new
`scripts/test-all-components-browser.mjs` visits the real `/components/` host,
uses its family navigation/hash and theme controls, waits for each real iframe's
ready state, then inspects the corresponding loaded document. It never substitutes
HTML fixtures or the older routes for the gallery.

## Intended coverage

- Checkbox, Tabs and Calendar in shadcn plus React, Vue, Solid and Svelte.
- Light/dark at 1440×1000 and 390×844: 60 frame cases.
- Capture actual CSS properties against the original reference in that same
  browser/scenario. Record each differing property rather than silently granting
  parity; only pixel-valued numeric differences up to 0.5px are tolerated.
- Checkbox Space toggles, checked+keyboard-focus measurements and screenshots.
- Tabs ArrowRight, disabled-tab skipping, Home/End, selection and visible panel.
- Calendar month/year changes verified by selecting an actual grid date;
  next/previous navigation, ArrowRight+Enter date selection, and inline visibility.
- Gallery and per-frame screenshots, console page errors, and incremental JSON
  evidence. Missing frames, state failures, style mismatches, incomplete coverage
  or launch/access errors cannot produce a pass.

These are targeted checks, not coverage of all 46 families. Screenshots still
need human visual review. The script does not establish assistive-technology,
full responsive, all animation, touch or complete component API acceptance.
It may reveal existing mismatches; a failing measurement is evidence to investigate,
not a reason to broaden tolerances until the suite passes.

## Future execution in an already-authorized browser-capable environment

First verify the intended preview URL and exact remote commit through the
hosting service. `EXPECTED_COMMIT` is an operator-provided provenance note,
**not** automatic proof of the served commit. Use an accessible authorized preview;
this runner does not disable protection, bypass security warnings, retrieve login
credentials, connect to a different computer or discover alternate executables.
Each scenario uses a fresh browser context, with no saved login or storage state.
A login in the operator's ordinary browser does not authenticate this runner.
Use a target already accessible to this authorized test context (or an authorized
local serving of the exact built gallery). A protected Vercel preview without that
access remains blocked; this script does not change protection or import sessions.
If launch/access fails, it reports the failure; it does not retry another route.

After installing the repository's locked dependencies, the explicit command is:

```sh
RUN_BROWSER_ACCEPTANCE=1 \
BASE_URL=https://YOUR-VERIFIED-PREVIEW.vercel.app \
EXPECTED_COMMIT=YOUR-VERIFIED-COMMIT \
node scripts/test-all-components-browser.mjs
```

`CHROMIUM_PATH` may identify the installed browser in that authorized environment.
Omit it to use Playwright's normally configured Chromium. Do not use this option
to route around an execution or access denial. No sandbox-disabling flags are set.

Artifacts go to `artifacts/all-components/browser/` (ignored by Git), including
`verification.json` and PNGs. `ARTIFACT_DIR` can name an explicit output directory.
A zero exit requires all 60 cases, no page errors and no recorded differences.
The JSON distinguishes failure from a fatal blocked launch and records limits.
Only share a completed report with its actual screenshots and remaining failures.

## Safe preparation checks (no browser)

```sh
node --check scripts/test-all-components-browser.mjs
node --check scripts/lib/gallery-browser-contract.mjs
node --test test/gallery-browser-contract.test.mjs
```

These validate parsing, target handling, coverage arithmetic, comparison tolerances,
reporting rules and source safeguards. They do not validate the Playwright locators
against a rendered page, perform keyboard actions, or create browser screenshots.
