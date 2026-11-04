import { createSignal, onMount, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Dialog } from '@destyler-ui/solid/dialog'

export function DialogExample() {
  const [mounted, setMounted] = createSignal(false)
  onMount(() => { setMounted(true) })

  return <Dialog.Root>
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Show when={mounted()}><Portal>
      <div data-portal-owner="solid">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-demo-dialog="solid">
            <Dialog.Title>Dialog title</Dialog.Title>
            <Dialog.Description>This is a dialog description.</Dialog.Description>
            <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>
    </Portal></Show>
  </Dialog.Root>
}
