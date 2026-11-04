import { createSignal, onMount, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Switch } from '@destyler-ui/solid/switch'
import { LocaleProvider } from '@destyler-ui/solid/locale'
import { Dialog } from '@destyler-ui/solid/dialog'

export function Example() {
  const [mounted, setMounted] = createSignal(false)
  const [checked, setChecked] = createSignal(true)
  onMount(() => { setMounted(true) })
  return <>
    <div data-cases>
      {[{ label: 'Updates', checked: true }, { label: 'Small', checked: false, small: true }, { label: 'Disabled', checked: true, disabled: true }, { label: 'Readonly', checked: true, readOnly: true }, { label: 'RTL', checked: true, rtl: true }].map(item => <LocaleProvider locale={item.rtl ? 'ar' : 'en-US'}><Switch.Root defaultChecked={item.label === 'Updates' ? undefined : item.checked} checked={item.label === 'Updates' ? checked() : undefined} onCheckedChange={details => { if (item.label === 'Updates') setChecked(details.checked) }} disabled={item.disabled} readOnly={item.readOnly} data-case={item.label.toLowerCase()}>
        <Switch.Control data-size={item.small ? 'sm' : undefined}><Switch.Thumb /></Switch.Control>
        <Switch.Label>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root></LocaleProvider>)}
    </div>
    <Dialog.Root id="css-only-dialog">
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Show when={mounted()}><Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner><Dialog.Content>
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>This dialog uses only native anatomy and one CSS import.</Dialog.Description>
          <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
        </Dialog.Content></Dialog.Positioner>
      </Portal></Show>
    </Dialog.Root>
  </>
}
