# Calendar application compatibility follow-up

## Scope

This follow-up starts from designs commit `393fe4465d93c1f905b51674ec6a2aa0f566e839`.
It changes only the four gallery Calendar compositions and their regression tests.
UI stays pinned to 0.0.5 and core to 0.3.5. No library default, package manifest,
lockfile, vendored reference, production deployment or access policy changes.

The earlier local candidate `8514a2b` was not pushed before the cloud workspace
was refreshed. This candidate reconstructs that scoped change from its implementation
record and reruns validation; it is a new commit, not a claim to recover the old SHA.

## Why an application adapter

The headless single-selection state machine sets the selected date and suppresses
notifications when the value is unchanged. Its default is not optional-toggle
selection. The reference demo uses DayPicker's optional single mode, where another
activation clears the chosen date. Changing onValueChange alone cannot implement
this because repeated selection does not notify it.

Each example now captures activation of a selected, selectable day and calls the
public `setValue([])` API. This leaves the displayed month and day focus alone.
`clearValue()` is deliberately not used: it also resets the focused date and
attempts to focus an input, which is wrong for this inline optional calendar.
Normal new-date selection, outside-month selection, navigation, cancelled events,
and disabled/unavailable dates retain native handling. Held activation keys do
not clear and then accidentally reselect. Capture avoids relying on each framework's
merged user/internal event-handler ordering.

The four small helper copies are intentionally framework-local so the existing
source exporter includes a self-contained example and its helper. A unit contract
keeps the copies byte-identical.

The reference's 2020–2030 display boundaries differ from native disabled-day
rendering. The examples now render empty leading grid cells for dates before
2020, preserving weekday alignment, and omit dates after 2030. There are no
hidden focusable day controls. This is a composition choice, not a claim that
all disabled dates should disappear. Actual min/max dates remain selectable.

## Verification coverage

- Pure adapter tests cover identical helpers, boundary classification, cancelled
  events, non-day targets, unavailable cells, secondary clicks, Enter/Space and
  held-key repeat handling.
- Every framework's existing SSR/hydration suite now checks repeated pointer
  selection, re-selection, Enter and Space clearing, stable day focus, key repeat,
  both boundary months, no out-of-bound interactive dates, leading blank cells,
  and selection of the exact minimum and maximum dates.
- Existing outside-month selection checks still run before those regressions.
- The pinned reference remains unchanged.

These are source, SSR and Happy DOM checks. Real-browser visual/keyboard/pointer
acceptance remains blocked by authentication and the cloud browser's local-page
access restriction. No workaround or screenshot/assistive-technology claim is made.
