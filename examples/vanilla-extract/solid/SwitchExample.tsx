import { createSignal } from 'solid-js'
import { Switch } from '@destyler-ui/solid/switch'
import { classes as c } from '@destyler/designs-vanilla-extract-poc'

export function SwitchExample() {
  const [checked, setChecked] = createSignal(false)
  return <Switch.Root checked={checked()} onCheckedChange={details => setChecked(details.checked)} class={c.switchRoot}>
    <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
}
