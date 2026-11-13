# Experimental application-level adoption recipe

This is an **opt-in proof of concept**, not a Ready API, automatic input
preservation, or a fix to the default uncontrolled behavior. The [known gap](./ready-prehydration-input.md)
remains. Do not deploy this narrow example as a general restoration policy.

## Run the four-framework examples

From the repository root with dependencies installed:

```sh
node test/ready-prehydrate-recipe-react-vue.mjs
node --test test/ready-prehydrate-recipe-solid-svelte.mjs
```

The files include the complete server and client fixtures. Each application uses
controlled Checkbox/Select props. An empty initial Select is still controlled;
these examples do not silently switch from uncontrolled to controlled mode.

## Sequence

1. Render the server's original state normally.
2. Immediately before hydration, read the relevant native controls into a snapshot
   keyed by the example's form scope and unique field name.
3. Hydrate against the **same original server state**, not the edited values. This
   preserves the server tree and avoids turning restoration into a hydration
   mismatch.
4. In the application's mounted/effect phase, explicitly accept the snapshot by
   setting the parent's controlled state. This is an application decision, not a
   synthetic user event or a change callback emitted by Ready.
5. Subsequent interactions use the ordinary controlled callbacks.

The four pinned-framework fixtures verify node/ID reuse, no captured hydration
warnings, agreement between visible/native/submitted values after adoption, no
invented change callback during adoption, and correct first later Checkbox and
Select callbacks. The input changes and client DOM are simulated with Happy DOM.
Actual browser restoration, autofill, early interaction and event replay have not
been verified.

## Why not add an automatic public API yet?

The successful fixture accepts valid snapshots for a fixed pair of uniquely named
fields. A reusable API must resolve substantially more than copying values:

| Decision | Unresolved production requirement |
| --- | --- |
| Identity | Repeated names, checkbox groups and repeated forms need explicit stable field keys, not the first matching control. |
| Validation | Reject or map stale values, removed/disabled options and malformed snapshots before acceptance. |
| Parent authority | Decide whether to accept restoration, reject it, or ask the user; rejecting must also reconcile native and visual state. |
| Timing | Edits after capture but before adoption can make the snapshot stale. Define a capture/readiness boundary or an event queue. |
| Reset | Choose whether reset returns to the original server baseline or a newly adopted baseline, and test it explicitly. |
| New server state | Do not let an old snapshot silently overwrite fresher application data. |
| Lifecycle | Define streaming, partial/multiple roots, remounts and repeated hydration attempts. |

A possible future separation is `capture → validate/decide → apply`, with the
application owning the acceptance decision and baseline. That is design notation,
not an exported package API. Adding `defaultChecked`/`defaultValue` alone would not
recover values already overwritten during hydration.

**Recommendation:** keep this explicit application recipe experimental rather
than adding automatic restoration to the small component API now. If an actual
consumer requires this feature, define its acceptance/reset/timing policy first,
then validate that policy in the target browsers before promoting it to a shared
hydration boundary or public helper. No default component contract changes here.
