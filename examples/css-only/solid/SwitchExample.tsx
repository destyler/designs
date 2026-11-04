import '@destyler/designs-css-only-poc/styles.css'
import { createSignal } from 'solid-js'
import { Switch } from '@destyler-ui/solid/switch'

export function SwitchExample() {
  const [checked, setChecked] = createSignal(false)
  return <Switch.Root checked={checked()} onCheckedChange={details => setChecked(details.checked)}>
    <Switch.Control><Switch.Thumb/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
}
