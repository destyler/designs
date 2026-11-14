# Bounded restoration policy experiment

This extends the [accepted-snapshot prototype](./ready-prehydration-recipe.md).
It adds explicit application decisions and negative cases, **not** a public Ready
API, a default behavior change or a reliable concurrent-input solution.

## Run and interpret

From the repository root with dependencies installed:

```sh
node test/ready-restore-policy-react-vue.mjs
node --test test/ready-restore-policy-solid-svelte.mjs
```

These opt-in scripts are outside `npm test`. They run real SSR followed by Happy
DOM hydration in separate processes and print per-scenario observations. A zero
exit status means the experiment's assertions ran, including assertions exposing
known gaps. Read the output; it does not mean all restoration policies are safe.

Four scenarios are exercised in each framework:

| Scenario | Explicit application behavior | Observed boundary |
| --- | --- | --- |
| Accept | Hydrate against original SSR state, then let the controlled parent adopt a valid captured snapshot. | Native, visible and submitted values agree; no synthetic user callback is invented. |
| Stale before hydration | Compare current values with the capture immediately before hydration. If changed, stop before importing/mounting the client. | New native values and form entries remain intact. There is no silent reset to the server baseline. The custom controls remain unhydrated until a new decision. |
| Reject | Only after an explicit rejection, keep authoritative parent state and reconcile native properties to that state. | This deliberately discards the proposed restored values; it is not automatic input preservation. |
| Late edit | Inject a property-only edit after hydration begins, before the accepted state settles. | The old snapshot overwrites the injected newer values. The earlier comparison is insufficient. |

## Identity and cancellation

The fixture uses explicit, distinct `data-field-key` values for controls sharing
the same form name. Capture/adoption is keyed by these identifiers, not the first
matching `name` or a flattened FormData object. Duplicate names can therefore
retain separate values and normal repeated FormData entries. This assumes valid,
unique keys; it does not define a generic schema for checkbox groups, repeated
rows, changing field identity or malformed/duplicate keys.

A stale capture is **not** the same as a business rejection. Stale detection pauses
hydration and leaves current native data untouched. The application must choose
whether to recapture, ask the user or abandon restoration. That pause preserves
data at the cost of delaying custom-control interactivity; it is not a complete
user experience. Explicit rejection instead permits the application to discard
restored input in favor of its authoritative state.

## Reset baseline selected for this experiment

This experiment chooses the **original SSR state** as the reset baseline.
React/Vue call `form.reset()` and verify the existing controlled reset path returns
to that baseline. The Solid/Svelte experiment instead installs an application
reset handler that cancels native reset, resets parent state and reconciles native
properties. These are distinct mechanisms, not one cross-framework reset API.
Neither changes the component's reset contract nor assumes that adopting a
restored value automatically creates a new baseline.
Other products may want the adopted values to become their reset baseline; that
is a different policy requiring separate tests. Native reset behavior remains
subject to the documented Happy DOM limitations and real-browser validation.

## The unresolved concurrency window

React/Vue inject the late property change just after the hydration call returns
and before the state settles. Solid/Svelte inject it at an explicit callback just
before mounted adoption. These are deliberate scheduling/fault-injection points,
not proof that a user can interrupt a synchronous browser call at those exact
instructions. All four demonstrate that the algorithm has no versioned handoff
covering this interval.

No input/change event accompanies the injected property write. Merely adding an
event listener cannot promise to capture every browser/script restoration. The
experiment neither serializes this interval nor merges late edits. It deliberately
reports the overwrite rather than hiding it with a final consistency assertion.
Invalid/disabled options, fresher server data and arbitrary dynamic fields also
remain outside the accepted-value fixture.

## Product decisions before expanding the API

1. **Editing availability:** may the application keep editable controls unavailable
   until the capture/adoption handoff completes, or must users be able to edit
   throughout? A pause needs an explicit loading/retry experience. Browser-native
   restoration still needs validation; hiding or blocking user interaction alone
   is not proof that every property restoration is prevented.
2. **Authority:** on a conflict, does restored input, newer user input or newer
   server data win? Who may reject input, and how is that rejection communicated?
3. **Reset:** should reset return to original SSR values or adopted values?
4. **Progressive enhancement:** if editing before JavaScript is a requirement,
   consider a native-first form design rather than promising that this custom
   component pilot already supports it.

Recommendation: retain this as an application-owned experiment. Do not add an
automatic recovery API until one real consumer chooses these policies and the
handoff is verified in its supported browsers. The default pre-hydration gap
remains unresolved; no component or upstream package is changed here.
