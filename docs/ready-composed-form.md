# Composed controlled form verification

The integration fixtures use actual compiled Ready Checkbox, Select and Dialog,
not mock controls: a controlled Dialog contains a form with controlled Checkbox
and Select values. The parent accepts change proposals. Both default and
Midnight scopes are exercised in React, Vue, Solid and Svelte.

Reproduce after `npm ci`:

```sh
node --test test/ready-form-flow-react-vue.test.mjs test/ready-form-flow-solid-svelte.test.mjs
```

The same files are included by `npm run test:ci`.

Common verified flow:

1. Open the Dialog; form stays inside the expected theme ancestor.
2. Required empty values prevent the application's submit handler from recording
   a submission. Custom error validity also blocks submission until cleared.
3. Accept Checkbox and Select changes in parent state. FormData reflects both
   values once the framework has committed the update.
4. Record a valid submission, close and reopen the Dialog, and retain the values.
5. Reset the mounted form to its initial unchecked/empty baseline. A repeated
   reset stays pristine; required validation prevents another submission.

React/Vue additionally exercise the app closing the Dialog after successful
submission and adding a Select error after a valid selection. Solid/Svelte
exercise errors on both controls at mount, clearing via an app button, explicit
Dialog closing after submission, and exact reset/change callback counts. This
is complementary coverage, not identical fixture code across frameworks.

No product defect was confirmed by this flow. The tests deliberately dispatch
`submit` and have the application call `checkValidity()` before reading FormData.
This tests the handler's gate, not native submit-button activation, browser
validation bubbles or requestSubmit ordering. Simulated DOM cannot establish
actual focus trapping, popup clipping, theme rendering, pointer hit targets,
mobile behavior or assistive-technology acceptance. These fixtures do not add a
server request, and they do not establish synchronous FormData correctness
inside a component's change callback. General nested overlays remain outside the
pilot contract; the Select opens only after its containing Dialog is open.
