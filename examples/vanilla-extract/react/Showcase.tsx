import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, Switch } from '@destyler-ui/react'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = useState(() => initialShowcaseState())
  const [checked, setChecked] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return connectShowcase(setView) }, [])
  const theme = themes[view.theme]

  return <main className={`showcase-stage ${theme}`} data-framework="react" data-theme={view.theme}>
    {view.component === 'switch' ? (
      <Switch.Root checked={checked} onCheckedChange={details => setChecked(details.checked)} className={c.switchRoot}>
        <Switch.Label className="showcase-sr-only">Airplane mode</Switch.Label>
        <Switch.Control className={c.switchControl}><Switch.Thumb className={c.switchThumb}/></Switch.Control>
        <Switch.HiddenInput role="switch"/>
      </Switch.Root>
    ) : (
      <Dialog.Root>
        <Dialog.Trigger className={c.button}>Open dialog</Dialog.Trigger>
        {mounted && createPortal(
          <div className={`showcase-portal ${theme}`} data-portal-owner="react" data-theme={view.theme}>
            <Dialog.Backdrop className={c.dialogBackdrop}/>
            <Dialog.Positioner className={c.dialogPositioner}>
              <Dialog.Content className={c.dialogContent} data-demo-dialog="react">
                <div className={c.dialogHeader}>
                  <Dialog.Title className={c.dialogTitle}>Dialog title</Dialog.Title>
                  <Dialog.Description className={c.dialogDescription}>This is a dialog description.</Dialog.Description>
                </div>
                <div className={c.dialogFooter}><Dialog.CloseTrigger className={c.button}>Close</Dialog.CloseTrigger></div>
              </Dialog.Content>
            </Dialog.Positioner>
          </div>, document.body,
        )}
      </Dialog.Root>
    )}
  </main>
}
