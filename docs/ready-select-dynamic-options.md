# Ready Select: changing options

Select distinguishes the **requested value** (the parent's controlled `value`, or
its own last selection) from the **effective selection** that exists in `options`.
This is a narrow data-replacement contract, not an asynchronous fetching API.
Every replacement must retain unique, nonempty option values, including disabled
entries. Exact duplicate keys throw a Ready error before creating the collection;
repeated labels with distinct keys remain valid. No option is silently discarded.

- Reordering options or changing a selected item's label updates its presentation
  without changing its value or emitting a value-change callback.
- If the requested value is missing, including while `options=[]`, the effective
  selection is empty. The trigger displays its placeholder and the native select
  contains a selected empty placeholder option. It must not silently select or
  submit the first available business option. `required` still rejects emptiness.
- The requested value is retained. If a matching option arrives later, it becomes
  the effective selection again, without a fabricated user-change callback. This
  applies to controlled and uncontrolled selections. An actual new user selection
  replaces the previous uncontrolled value; controlled state remains parent-owned.
- Disabling an already selected option does not silently discard that selection.
  It remains displayed and selected, but cannot be newly chosen through the list.
  Native successful-control rules exclude a selected disabled option from form
  submission. Do not rely on `required` to reject that case: an application that
  withdraws a choice should explicitly clear its controlled value or supply an
  application validation error, and must validate submitted data on the server.

A missing value is not a request to change the parent's state. The component does
not emit a clearing callback solely because data disappears. Applications that
want permanent removal rather than restoration should update their controlled
value themselves. No loading spinner, request cancellation, out-of-order response
handling, or loading/error lifecycle is provided. Replace `options` through the
framework's reactive update mechanism.

## Regression coverage

```sh
node --test --test-concurrency=1 test/ready-select-dynamic-*.test.mjs
```

The four-framework checks cover deletion/reinsertion, disabled/enabled selection,
reordering/relabeling, empty-to-loaded options and controlled missing-value
restoration, including displayed text, native state and callback behavior. Real
server rendering without DOM globals also covers an initially missing controlled
value with nonempty options. The same markup is then hydrated with the actual
framework API in Happy DOM, checking node/ID reuse, hydration warnings, user
selection with parent acceptance/refusal, and later matching-option restoration.
This previously emitted no selected option, allowing
the parsed native select to choose the first option despite the visible placeholder.

Client and parsed-HTML checks use Happy DOM, not a real browser. Plain native
fixtures reproduce simulator limitations: it serializes a select with no
selected option as an empty entry, includes selected disabled options, and can
report `selectedIndex=-1` for a parsed selected empty option even while that
option reports `selected=true`. SSR assertions check the serialized and live
selected option directly rather than trusting that index. The
tests record these limitations rather than changing native semantics to match
Happy DOM. A deliberately selected empty placeholder is different from having no
selected option. Real browser submission, keyboard and assistive-technology
acceptance remain unverified.

## Reset baseline while options are missing

The reset baseline is the original **requested** mount value, not the empty
selection temporarily displayed while options are missing. For example, a
controlled Select mounted with `value="b"` and `options=[]` retains `b` as its
logical reset baseline. Loading option `b` must not make a later reset request
`""`. If the current requested value is already `b`, the primitive may suppress
the unchanged proposal. After changing to `a`, reset proposes `b`; the parent may
accept or refuse as usual. If `b` is still unavailable, accepting the proposal
keeps an empty effective selection until `b` arrives.

Only the native hidden select's rendered/synchronized state uses the effective
value. The primitive retains the original requested value and its existing reset
listener. No second reset listener or callback remapping is introduced. Canceled
resets remain canceled. This does not change the separately disclosed contract
for input edited or restored before hydration.

### Native synchronization regression

During the Ready-owned description verification, the existing React/Vue dynamic
option regression exposed an empty placeholder option with `defaultSelected=true`
but `selected=false` and `selectedIndex=-1`. A later run also showed React's
visible label already updated to Z while the native list still held the older
options and submitted an empty value. These failures were not dismissed as
parallel-test noise or hidden by increasing the test delay.

React/Vue now render native options from the same validated current options as
the effective value, rather than pairing a new effective value with an older
primitive collection snapshot. HiddenSelect also reconciles native selection
after primitive snapshot commits; Vue explicitly overrides the normalized raw
native `value` with the effective value. This retains the primitive ID, form
binding and original requested reset baseline. It adds no polling, second reset
listener or core/UI change.

The regressions continue to check missing-value restoration, removal, callbacks,
reset and SSR/hydration. They establish observed simulated-DOM behavior, not
browser submission or synchronous callback-time guarantees. The separate
pre-hydration-input limitations remain unchanged.
