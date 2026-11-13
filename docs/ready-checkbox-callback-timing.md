# Checkbox callbacks are proposals, not submission barriers

Do not synchronously read or submit `FormData` inside `onCheckedChange` and assume
it represents the controlled parent's final accepted/refused state. The callback
carries a proposed boolean. It is not a notification that the parent's update or
the native checkbox DOM has finished committing.

## Observed negative cases

Actual compiled Ready components were tested with checked and unchecked initial
states, parents accepting/refusing proposals, and native `input.click()` in Happy
DOM. Snapshots were taken inside the callback, at click return, after one
microtask and after framework updates settled. The callback snapshots are **not**
replaced by the later settled values in the report.

| Adapter | Native checked/FormData at callback entry in this fixture |
| --- | --- |
| React | Previous value, even when the proposal will be accepted |
| Vue | Attempted new value, even when the parent refuses |
| Solid | Attempted new value, even when the parent refuses |
| Svelte | Attempted new value, even when the parent refuses |

Thus a parent refusing false→true can still read a checked checkbox inside the
Vue/Solid/Svelte callback. Conversely React's accepting parent can read the old
unchecked value there. In these fixtures all four converge to the parent's
accepted/refused state later. Neither click return nor a single microtask is a
cross-framework completion signal. These exact intermediate timings are
observations of pinned dependencies in a simulator, not public guarantees about
browsers or future framework versions.

A plain native checkbox control was also sampled in click/input/change listeners.
Its click listener sees the tentative toggle. Calling `preventDefault()` in that
listener does not change the snapshot already taken; the cancellation rollback
occurs later. This illustrates why in-event form reads can be transient, but
native event cancellation is **not** the same contract as a controlled parent
refusing a proposal. No actual network submission or browser default behavior was
verified by these comparisons.

## Application guidance and repair decision

For an immediate business action, decide whether to accept the proposal and form
the payload from the application's authoritative state plus that decision. A
refused proposal must not be treated as an accepted form value merely because a
live native checkbox temporarily reflects it. Preserve the normal omission of an
unchecked checkbox when constructing your own payload.

If an application needs DOM-derived `FormData`, separate submission from the
proposal callback and wait for its framework's committed update lifecycle, then
validate the data. This is not a promise that `queueMicrotask`, one `await`, a fixed
timeout, or a shared framework-neutral helper is sufficient. Such a submission
integration needs its own real-browser verification.

No component change is made here. Forcing the native property before the callback
would substitute another transient value, still could not know whether an
asynchronous parent accepts, and could disrupt native event behavior. Deferring
or relabeling the callback would change the API without providing a reliable
cross-framework commit signal. A new commit/submit protocol is outside this pilot.
The stable-state contract remains intact; the synchronous callback hazard is now
explicit. Pre-hydration input restoration is unaffected.

## Reproduce observations

```sh
node test/ready-checkbox-sync-react-vue.mjs
node --test test/ready-checkbox-timing-solid-svelte.mjs
```

These opt-in observation scripts are intentionally outside `npm test`. Read the
printed per-phase snapshots and native controls. Exit 0 only means the scripts'
assertions completed; it does not turn every intermediate observation into a
supported invariant or prove submission safety. They do not inspect a real
browser accessibility tree, perform browser keyboard activation or establish
screen-reader behavior.
