import { useState } from 'react'
import { Switch } from '@destyler-ui/react'
import { classes as c } from '@destyler/designs-vanilla-extract-poc'

export function SwitchExample() {
  const [checked, setChecked] = useState(false)
  return <Switch.Root checked={checked} onCheckedChange={details => setChecked(details.checked)} className={c.switchRoot}>
    <Switch.Control className={c.switchControl}><Switch.Thumb className={c.switchThumb}/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
}
