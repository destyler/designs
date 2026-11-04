<script lang="ts">
import { onMount } from 'svelte'
import { Switch } from '@destyler-ui/svelte/switch'
import { LocaleProvider } from '@destyler-ui/svelte/locale'
import { Dialog } from '@destyler-ui/svelte/dialog'
let mounted = $state(false)
let checked = $state(true)
onMount(() => { mounted = true })
const cases = [{ label: 'Updates', checked: true }, { label: 'Small', checked: false, small: true }, { label: 'Disabled', checked: true, disabled: true }, { label: 'Readonly', checked: true, readOnly: true }, { label: 'RTL', checked: true, rtl: true }]
function bodyPortal(node: HTMLElement) {
  document.body.appendChild(node)
  return { destroy() { node.remove() } }
}
</script>
<div data-cases>
  {#each cases as item}
    <LocaleProvider locale={item.rtl ? 'ar' : 'en-US'}>
    <Switch.Root defaultChecked={item.label === 'Updates' ? undefined : item.checked} checked={item.label === 'Updates' ? checked : undefined} onCheckedChange={details => { if (item.label === 'Updates') checked = details.checked }} disabled={item.disabled} readOnly={item.readOnly} data-case={item.label.toLowerCase()}>
      <Switch.Control data-size={item.small ? 'sm' : undefined}><Switch.Thumb /></Switch.Control>
      <Switch.Label>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
    </Switch.Root>
    </LocaleProvider>
  {/each}
</div>
<Dialog.Root id="css-only-dialog">
  <Dialog.Trigger>Open dialog</Dialog.Trigger>
  {#if mounted}
    <div use:bodyPortal>
      <Dialog.Backdrop />
      <Dialog.Positioner><Dialog.Content>
        <Dialog.Title>Dialog title</Dialog.Title>
        <Dialog.Description>This dialog uses only native anatomy and one CSS import.</Dialog.Description>
        <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
      </Dialog.Content></Dialog.Positioner>
    </div>
  {/if}
</Dialog.Root>
