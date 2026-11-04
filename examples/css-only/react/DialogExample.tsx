import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '@destyler-ui/react'

export function DialogExample() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return <Dialog.Root>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    {mounted && createPortal(
      <div data-portal-owner="react">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-demo-dialog="react">
            <Dialog.Title>Dialog title</Dialog.Title>
            <Dialog.Description>This is a dialog description.</Dialog.Description>
            <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>, document.body,
    )}
  </Dialog.Root>
}
