import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Dialog } from '@destyler-ui/solid/dialog'
import { Switch } from '@destyler-ui/solid/switch'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = createSignal(initialShowcaseState())
  const [checked, setChecked] = createSignal(false)
  const [mounted, setMounted] = createSignal(false)
  onMount(() => { setMounted(true); onCleanup(connectShowcase(setView)) })
  const theme = () => themes[view().theme]

  return <main class={`showcase-stage ${theme()}`} data-framework="solid" data-theme={view().theme}>
    {view().component === 'switch' ? (
      <Switch.Root checked={checked()} onCheckedChange={details => setChecked(details.checked)} class={c.switchRoot}>
        <Switch.Label class="showcase-sr-only">Airplane mode</Switch.Label>
        <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control>
        <Switch.HiddenInput role="switch"/>
      </Switch.Root>
    ) : (
      <Dialog.Root>
        <Dialog.Trigger class={c.button}>Open dialog</Dialog.Trigger>
        <Show when={mounted()}><Portal>
          <div class={`showcase-portal ${theme()}`} data-portal-owner="solid" data-theme={view().theme}>
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
    )}
  </main>
}
