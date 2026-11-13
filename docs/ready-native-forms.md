# Ready native form constraints

Checkbox and Select expose two small validation props in addition to `name` and
`disabled`:

- `required?: boolean` forwards the native required constraint through the
  primitive. Select's accessible trigger also reflects `aria-required`.
- `error?: string` is an explicit application validation error. A nonempty value
  renders associated error text, marks the control invalid and calls the native
  control's `setCustomValidity(error)` after client mount. Clearing it clears
  that custom error, without removing a separate required constraint.

This does not add a form library or automatically generate application messages.
Native missing-value validation uses the browser's own validation behavior;
`error` supplies the application's message. The application decides when to show
or clear an error (for example after a server response). Disabled controls retain
their configured error but do not participate in native constraint validation
until enabled again.

```tsx
<Checkbox name="terms" label="Accept the terms" required error={termsError} />
<Select name="plan" label="Plan" required error={planError}
  options={[{ label: 'Personal', value: 'personal' }, { label: 'Team', value: 'team' }]} />
```

Use the same props with each framework's component syntax. Vue/Svelte do not use
React's event syntax; their existing callbacks/v-model conventions are unchanged.
Error messages get stable IDs and are added to the native control and Select
trigger's `aria-describedby` without discarding a Field helper description.
Absent props preserve the surrounding Field's required/invalid/disabled context
rather than introducing an explicit false override. In particular, omitting
`disabled` inherits the Field's current disabled state, including later changes;
passing `disabled={false}` (or the framework's equivalent binding) explicitly
overrides a disabled Field and enables that control. An explicit `true` keeps the
control disabled even when the Field is enabled.

## Server and reset boundaries

Required/disabled attributes and error text/ARIA can be emitted during SSR.
`setCustomValidity` is a live-DOM operation, so an application `error` only blocks
native validation **after hydration/client mount**. SSR error markup alone is not
a no-JavaScript submission barrier. Always validate submitted data on the server.
This does not resolve the separate pre-hydration input-preservation limitation.

A native form reset resets component values through the existing reset path; it
does not silently clear an application-owned `error` prop. Clear that prop in the
application when its validation policy calls for it. No duplicate business reset
listener or synthetic change event is added by the validation props.

## Verification scope

The four-framework native-form tests compare real compiled controls against plain
native control fixtures in Happy DOM. They check required validity, valid values,
custom error messages and clearing, disabled/re-enabled validity, names and form
values, reset, and error/helper ARIA association. Simulated `requestSubmit` checks
exercise the validity gate while preventing navigation. The separate four-framework
SSR/hydration suites also render error-bearing markup without DOM globals, then
hydrate the original nodes in Happy DOM. They check stable error IDs and ARIA,
client-only custom validity, and dynamic error clearing while retaining required
constraints. Clearing an own error restores the surrounding Field invalid state
(or false without a Field), rather than leaving stale `aria-invalid="true"`.

Happy DOM incorrectly includes a disabled `select` in `FormData`, even for a bare
native select. Tests expose that control-environment limitation rather than
changing Ready to match it. Disabled attributes and constraint exclusion can be
checked here, but browser-correct successful-control omission is not proven by
these simulated submissions. Native validation popup appearance, focus on invalid
controls, browser submission behavior and assistive-technology announcements
still require real-browser acceptance. No test result here is a security boundary.
