# Gallery review, 2026-11-11

## Scope and outcome

Reviewed draft PR #2 at `bc394a7a83ae72658d0f4c0c3b78fe68afccf8dd` and the
corrections in this revision, using the cloud workspace only. The reviewed Preview
is https://destyler-designs-prototype-gvlwoxeia-elone-hoos-projects.vercel.app/components/.
That immutable Preview represents the original commit, not these later corrections.

This is **source, build, SSR and simulated-DOM verification**, not visual acceptance.
No page was opened, no browser launch was retried, and no screenshots or real
keyboard/pointer/assistive-technology results were produced. A read-only surface
inventory did not establish authorization to retry the previously blocked launch.

## Corrected source discrepancies

- Checkbox uses the same 14px Lucide check geometry, 24px viewBox, 2px stroke and
  rounded caps/joins in all four frameworks. Svelte previously drew a much smaller
  check, Vue had a different effective stroke, and React/Solid lacked round ends.
- Invalid Checkbox changes border/ring color, but only keyboard focus introduces
  the 3px ring. The previous adapter added a ring even when unfocused.
- Disabled Checkbox labels retain the reference foreground color before 50%
  opacity. A lower-layer muted color previously remained active as well.
- Unselected outside-month Calendar dates no longer override the light-theme
  ghost hover foreground with a more specific muted-color selector.
- The prepared browser runner now handles the real Calendar accessible names,
  short/long month options with different value bases, and the extra hidden
  month-announcement status in DayPicker. See the [browser plan](gallery-browser-acceptance.md).

The disabled/invalid Checkbox states have no matching live gallery fixtures.
Their corrections are source contracts, not newly executed visual state coverage.

## Verified checks

The cloud workspace installed the locked packages normally with `npm ci`.
The initial offline attempt lacked cached package archives and was replaced by a
successful ordinary registry install. No dependency versions or lockfile changed.

- Complete production build.
- 101 unit tests, zero failures or skips.
- JavaScript syntax check, four-framework/reference type checks, and Astro's
  44-file check with zero errors, warnings or hints.
- Nine-stage all-component aggregate: 46 original reference states, 184 native
  SSR/hydration examples, static semantics, stylesheet/assets and 28 host tests.
- All four native simulated-DOM suites select an actual outside-month day, check
  enabled semantics, selected feedback and the Calendar selected marker.
- Targeted React/reference Happy DOM comparison reproduced both remaining
  Calendar differences below without runtime errors.

Existing upstream date default-export and large-bundle warnings remain. An
intermediate asset check ran against a build from before the local source edits;
the final build and aggregate were rerun together after the corrections.

## Remaining differences

1. **Repeated date selection:** clicking November 15 twice clears selection in the
   reference (`Select a date`), while the native single-selection Calendar keeps
   `Selected: 2026-11-15`. This is a headless behavior difference, not fixed with CSS.
2. **Boundary months:** in January 2020, native Calendar renders December 29–31,
   2019 as visible disabled outside cells; DayPicker leaves those dates hidden.
   In December 2030, native Calendar renders January 1–4, 2031 disabled, while
   DayPicker truncates beyond its end month. Both retain their existing bounds.
3. **Unverified:** rendered geometry, mobile overflow, actual dark/light pixels,
   keyboard traversal, focus restoration, native dropdown behavior, forced colors,
   real disabled interaction and screen-reader output. Source declarations and
   Happy DOM cannot establish these results.

No vendored shadcn component, UI/core package, production deployment or repository
security setting was changed. No merge or PR-description update is part of this review.
