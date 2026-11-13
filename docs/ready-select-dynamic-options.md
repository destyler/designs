# Ready Select: changing options

Select distinguishes the **requested value** (the parent's controlled `value`, or
its own last selection) from the **effective selection** that exists in `options`.
This is a narrow data-replacement contract, not an asynchronous fetching API.

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
