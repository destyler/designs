import { ClientPortal } from '../../ClientPortal'
import { Dialog } from '@destyler-ui/react'

export function Basic(props: Dialog.RootProps = {}) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <ClientPortal>
          <Dialog.Backdrop />
          <Dialog.Positioner data-testid="positioner">
            <Dialog.Content>
              <Dialog.Title>Dialog Title</Dialog.Title>
              <Dialog.Description>Dialog Description</Dialog.Description>
              <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </ClientPortal>
    </Dialog.Root>
  )
}
