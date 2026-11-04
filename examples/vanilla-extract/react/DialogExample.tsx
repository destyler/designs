import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '@destyler-ui/react'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'

export function DialogExample({ colorMode }: { colorMode: 'light' | 'dark' }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const theme = themes[colorMode]

  return (
    <Dialog.Root>
      <Dialog.Trigger className={c.button}>Open dialog</Dialog.Trigger>
      {mounted && createPortal(
        <div className={`showcase-portal ${theme}`} data-portal-owner="react" data-theme={colorMode}>
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
  )
}
