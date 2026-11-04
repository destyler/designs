import '@destyler/designs-css-only-poc/styles.css'
import { useState } from 'react'
import { Switch } from '@destyler-ui/react'

export function SwitchExample() {
  const [checked, setChecked] = useState(false)
  return <Switch.Root checked={checked} onCheckedChange={details => setChecked(details.checked)}>
    <Switch.Control><Switch.Thumb/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
}
