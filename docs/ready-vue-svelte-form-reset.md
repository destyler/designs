# Ready Vue/Svelte form reset evidence

The initial ready wrappers reproduced a submission mismatch: after mounting with
controlled `checked=false` and `value=""`, the parent changed to `true` and `b`.
When the parent ignored the subsequent reset requests, the visible Select kept B
but the hidden select reverted to A. Form submission could therefore disagree
with the displayed selection. Checkbox remained consistent.

The Select correction uses its existing change callback and the framework's
nextTick/tick followed by a deferred DOM synchronization after the parent and
primitive have updated. The selected option attribute (the standard reflection
of defaultSelected) and current value follow the latest effective value. A
post-render effect covers a nonempty initial controlled value and parent-driven
updates even when no change callback fires. It adds no reset listener and does not
suppress or duplicate callbacks. The core's reset request to the mount-time value
is retained: a controlled parent may accept it or ignore it. Uncontrolled values
reset to false and empty.

`test/ready-form-vue-svelte.test.mjs` mounts actual wrappers inside a form and
checks uncontrolled resets, controlled accept/ignore after parent updates, and
canceled resets. It also checks a nonempty initial controlled value through
repeated resets with no callbacks. It checks visible state, hidden state, callback
count, the native empty option and its selected/default attribute, and FormData.

Happy DOM's HTMLFormElement.reset mutates controls before dispatching its reset
event and does not honor preventDefault. The cancellation case therefore explicitly
dispatches a cancelable reset event and runs no default action when canceled,
matching the expected event ordering. Other cases exercise its actual reset method.
Happy DOM also lacks the defaultSelected property reflection, so the test checks
the selected attribute directly. These are simulated DOM regressions, not a
native-browser form-reset guarantee.

`test/ready-vue-svelte.test.mjs` also switches a mounted scope's theme and overrides
a token before closing/reopening its dialog. The assertions cover state retention,
inline-overlay ancestry and the override declaration only. They do not measure
computed styles, rendering, contrast, or assistive-technology behavior.
