import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Dialog } from '@destyler-ui/solid/dialog'
import { Switch } from '@destyler-ui/solid/switch'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState, notifications } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = createSignal(initialShowcaseState())
  const [checked, setChecked] = createSignal<Record<string, boolean>>({ updates: true, marketing: false, security: true })
  const [mounted, setMounted] = createSignal(false)
  onMount(() => { setMounted(true); onCleanup(connectShowcase(setView)) })
  const theme = () => themes[view().theme]
  return <main class={`showcase-stage ${theme()}`} data-framework="solid" data-theme={view().theme}>
    {view().component === 'switch' ? <section class="showcase-card" aria-label="Notifications">
      <header class="showcase-heading"><h2>Notifications</h2><p>Choose what reaches your inbox.</p></header>
      <div class="showcase-stack">{notifications.map(item => <Switch.Root checked={checked()[item.key]} onCheckedChange={details => setChecked(value => ({ ...value, [item.key]: details.checked }))} disabled={item.disabled} class={`${c.switchRoot} showcase-row ${item.disabled ? 'showcase-disabled' : ''}`} data-case={item.key}>
        <div class="showcase-copy"><Switch.Label class="showcase-label">{item.label}</Switch.Label><p class="showcase-description">{item.description}</p></div>
        <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control><Switch.HiddenInput role="switch"/>
      </Switch.Root>)}<p class="showcase-status" role="status">{Object.values(checked()).filter(Boolean).length} of 3 notifications enabled.</p></div>
    </section> : <section class="showcase-card showcase-dialog-card" aria-label="Notification preferences">
      <header class="showcase-heading"><h2>Notification preferences</h2><p>A little less noise. The updates that matter.</p></header>
      <div class="showcase-stack">{[['Product updates', 'On'], ['Marketing emails', 'Off'], ['Helpful tips', 'On']].map(([label, value]) => <div class="showcase-row"><span class="showcase-label">{label}</span><span class="showcase-description">{value}</span></div>)}</div>
      <Dialog.Root><Dialog.Trigger class={`${c.button} showcase-open`}>Review preferences</Dialog.Trigger>
        <Show when={mounted()}><Portal><div class={`showcase-portal ${theme()}`} data-portal-owner="solid" data-theme={view().theme}>
          <Dialog.Backdrop class={c.dialogBackdrop}/><Dialog.Positioner class={c.dialogPositioner}><Dialog.Content class={c.dialogContent} data-demo-dialog="solid">
            <div class={c.dialogHeader}><Dialog.Title class={c.dialogTitle}>Your preferences</Dialog.Title><Dialog.Description class={c.dialogDescription}>Demo only. No settings are sent or stored.</Dialog.Description></div>
            <p>Marketing: off · Updates: on · Tips: on</p>
            <div class={c.dialogFooter}><Dialog.CloseTrigger class={c.button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content></Dialog.Positioner>
        </div></Portal></Show>
      </Dialog.Root>
    </section>}
  </main>
}
