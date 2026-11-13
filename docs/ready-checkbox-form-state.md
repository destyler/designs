# Ready Checkbox form-state regression

The four-framework fixtures compile actual Ready components and inspect them in
Happy DOM. No component implementation defect was found in the tested settled
states; this pass adds regression evidence rather than changing event handling.

## Covered behavior

- Controlled parents accepting or refusing a boolean change proposal, and
  uncontrolled local state, including checked and unchecked controlled starts.
- Actual simulated-DOM `input.click()`, visible label clicks and visible control
  clicks, each repeated. A refusing parent retains its value after updates settle;
  each attempted toggle proposes the opposite value, not a DOM Event.
- Disabled controls do not toggle or emit proposals through those click paths.
  Re-enabling restores participation. `required`, native checked state, visual
  state and `FormData` agree after framework updates settle.
- Reset from a changed state, parent acceptance/refusal, repeated reset and
  cancellation. Accepted controlled reset restores the mount value; uncontrolled
  reset restores false. A refusing parent may receive the same initial-value
  proposal on each reset while keeping its current state. No-op resets need not
  emit another callback.

The actual Happy DOM `form.reset()` method is used for successful resets. As in the
existing reset suites, cancellation is explicitly checked with a cancelable reset
event and no default action: Happy DOM's reset/default-action ordering differs
from the browser algorithm. This model is not real-browser reset verification.

## Keyboard and timing limits

Dispatching Space `keydown`/`keyup` events in Happy DOM does not synthesize native
checkbox activation, even for the plain native checkbox control fixture. Seeing
no change after those events is therefore **not** evidence of a Ready keyboard
failure or keyboard accessibility success. Real-browser Space activation, Tab
navigation, focus-visible treatment and assistive-technology behavior still need
verification. The tests do not manually toggle checked state to pretend that
keyboard activation occurred.

Assertions concern settled framework state. Intermediate values immediately after
an event, before framework updates flush, may differ. This pass does not guarantee
that synchronously reading or submitting a form from inside a change callback sees
the final accepted/refused state. It does not add extra listeners, synthetic
business events or speculative reconciliation to mask simulator timing.

`FormData` checks inspect serialization without navigating or sending a request.
They do not establish browser-native submission timing or validation UI. The
separate pre-hydration input-restoration limitation is unchanged.

## Reproduce

```sh
node --test --test-concurrency=1 test/ready-checkbox-native-react-vue.test.mjs test/ready-checkbox-state-solid-svelte.test.mjs
```
