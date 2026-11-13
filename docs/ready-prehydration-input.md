# Known gap: native values changed before hydration

**Ready does not currently preserve and reconcile form values changed between SSR
and hydration reliably.** The existing SSR tests establish correct server output
and hydration when the DOM still matches that output. They do not establish this
separate restoration/input scenario. Do not treat the behavior below as a desired
contract or assume that absence of hydration warnings means no input was lost.

## Reproduce the investigation

From the repository root after `npm ci`:

```sh
node test/ready-prehydrate-react-vue.mjs
node --test test/ready-prehydration-solid-svelte.mjs
```

These opt-in investigations are deliberately outside the default `*.test.mjs`
suite. Successful execution means the observations were reproduced, **not** that
pre-hydration input preservation passed acceptance. They use actual server
rendering in a process without a DOM, then simulated client hydration in Happy
DOM. No component implementation or default value contract is changed here.

The fixture modifies native `checked` and `select.value` after parsing server HTML
but before hydrating. React/Vue additionally dispatch `input`/`change` before any
client listeners are installed; Solid/Svelte use property changes without events,
modeling a restored native value. Both controlled parents and uncontrolled
components are observed. Snapshots include native values, visual state, FormData,
callbacks, hydration-return and settled phases, and the first later interaction.

This is a native-value restoration model, not proof of real-browser autofill.
Select's native control is hidden and is not its normal visible interaction path.
Actual browser restoration, native label activation, early clicks and event replay
still require browser-specific testing.

## Observed settled behavior on the pinned versions

| Adapter | Checkbox edited before hydration | Select edited before hydration |
| --- | --- | --- |
| React | Native checked value survives, but visual/machine state stays old | Edited value is overwritten after hydration settles |
| Vue | Native checked value survives, but visual/machine state stays old | Edited value is overwritten during hydration |
| Solid | Native checked value survives, but visual/machine state stays old | Edited value is overwritten |
| Svelte | Edited native checked value is overwritten | Edited value is overwritten; uncontrolled value briefly survives before settling |

In the React/Vue/Solid Checkbox fixtures, FormData initially reflects the edited
native value while the visible control remains unchecked. The first subsequent
control click restores the native value to the old machine state without emitting
a change callback. This is an observable inconsistency, not acceptable evidence of
input preservation. Svelte's first later click changes state and emits a callback,
but that does not undo the earlier loss.

For Select, controlled fixtures return to the parent's server value and
uncontrolled fixtures return to the empty local value, without a hydration-time
change callback. A later normal selection works and emits a callback. That later
success does not mean the earlier restored value was retained. These failures can
occur without hydration warnings.

## Contract assessment and next step

- Uncontrolled controls should aim to adopt valid restored native values into
  their local machine state, not merely retain a divergent native property.
- Controlled controls must not silently overwrite the parent's business state.
  The application needs an explicit choice to accept or reject restored values;
  visual state, native state and submitted data must then agree.
- A late mounted effect cannot recover a value that hydration already overwrote.
  A robust cross-framework strategy therefore needs a snapshot **before** hydration
  and an explicit adoption policy, rather than forcing native values back to props
  and declaring the problem fixed.

A minimal candidate is application-level bootstrap: capture the relevant native
values before hydration, hydrate against the original server state, then let the
controlled parent explicitly accept the snapshot. It still requires verification
of warning-free hydration, callbacks, reset defaults, invalid/stale options and
subsequent interactions. It is a proposal, not a shipped API or a verified recipe.
No automatic restoration API or new default contract is introduced by this report.

Until such a policy is implemented and tested, applications must not rely on this
pilot to retain edits or restored values across this interval. Plan an explicit
application strategy and verify it in the browsers you support. This limitation
is independent of the fixed SSR selected-option serialization issue.
