import '@destyler/designs-css-only-poc/styles.css'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Switch, Dialog, LocaleProvider } from '@destyler-ui/react'

export function Example() {
  const [mounted, setMounted] = useState(false)
  const [checked, setChecked] = useState(true)
  useEffect(() => { setMounted(true) }, [])
  return <>
    <div data-cases>
      {[{ label: 'Updates', checked: true }, { label: 'Small', checked: false, small: true }, { label: 'Disabled', checked: true, disabled: true }, { label: 'Readonly', checked: true, readOnly: true }, { label: 'RTL', checked: true, rtl: true }].map(item => <LocaleProvider key={item.label} locale={item.rtl ? 'ar' : 'en-US'}><Switch.Root defaultChecked={item.label === 'Updates' ? undefined : item.checked} checked={item.label === 'Updates' ? checked : undefined} onCheckedChange={details => { if (item.label === 'Updates') setChecked(details.checked) }} disabled={item.disabled} readOnly={item.readOnly} data-case={item.label.toLowerCase()}>
        <Switch.Control data-size={item.small ? 'sm' : undefined}><Switch.Thumb /></Switch.Control>
        <Switch.Label>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root></LocaleProvider>)}
    </div>
    <Dialog.Root id="css-only-dialog">
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      {mounted && createPortal(<>
        <Dialog.Backdrop />
        <Dialog.Positioner><Dialog.Content>
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>This dialog uses only native anatomy and one CSS import.</Dialog.Description>
          <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
        </Dialog.Content></Dialog.Positioner>
      </>, document.body)}
    </Dialog.Root>
  </>
}
