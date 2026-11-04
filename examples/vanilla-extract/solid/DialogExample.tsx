import { createSignal, onMount, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Dialog } from '@destyler-ui/solid/dialog'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'

export function DialogExample(props: { colorMode: 'light' | 'dark' }) {
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const theme = () => themes[props.colorMode]

  return (
    <Dialog.Root>
      <Dialog.Trigger class={c.button}>Open dialog</Dialog.Trigger>
      <Show when={mounted()}><Portal>
        <div class={`showcase-portal ${theme()}`} data-portal-owner="solid" data-theme={props.colorMode}>
          <Dialog.Backdrop class={c.dialogBackdrop}/>
          <Dialog.Positioner class={c.dialogPositioner}>
            <Dialog.Content class={c.dialogContent} data-demo-dialog="solid">
              <div class={c.dialogHeader}>
                <Dialog.Title class={c.dialogTitle}>Dialog title</Dialog.Title>
                <Dialog.Description class={c.dialogDescription}>This is a dialog description.</Dialog.Description>
              </div>
              <div class={c.dialogFooter}><Dialog.CloseTrigger class={c.button}>Close</Dialog.CloseTrigger></div>
            </Dialog.Content>
          </Dialog.Positioner>
        </div>
      </Portal></Show>
    </Dialog.Root>
  )
}
