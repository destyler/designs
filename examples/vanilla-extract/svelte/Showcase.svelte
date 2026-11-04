<script lang="ts">
  import { onMount } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  import { Switch } from '@destyler-ui/svelte/switch'
  import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
  import { connectShowcase, initialShowcaseState, notifications } from '../shared/showcase'
  import '@fontsource-variable/geist'
  import '../shared/showcase.css'
  let view = $state(initialShowcaseState())
  let checked = $state<Record<string, boolean>>({ updates: true, marketing: false, security: true })
  let mounted = $state(false)
  onMount(() => { mounted = true; return connectShowcase(value => { view = value }) })
  const theme = $derived(themes[view.theme])
  function bodyPortal(node: HTMLElement) {
    document.body.appendChild(node)
    return { destroy() { node.remove() } }
  }
</script>
<main class={`showcase-stage ${theme}`} data-framework="svelte" data-theme={view.theme}>
  {#if view.component === 'switch'}
    <section class="showcase-card" aria-label="Notifications">
      <header class="showcase-heading"><h2>Notifications</h2><p>Choose what reaches your inbox.</p></header>
      <div class="showcase-stack">
        {#each notifications as item (item.key)}
          <Switch.Root checked={checked[item.key]} onCheckedChange={details => { checked[item.key] = details.checked }} disabled={item.disabled} class={`${c.switchRoot} showcase-row ${item.disabled ? 'showcase-disabled' : ''}`} data-case={item.key}>
            <div class="showcase-copy"><Switch.Label class="showcase-label">{item.label}</Switch.Label><p class="showcase-description">{item.description}</p></div>
            <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control><Switch.HiddenInput role="switch"/>
          </Switch.Root>
        {/each}
        <p class="showcase-status" role="status">{Object.values(checked).filter(Boolean).length} of 3 notifications enabled.</p>
      </div>
    </section>
  {:else}
    <section class="showcase-card showcase-dialog-card" aria-label="Notification preferences">
      <header class="showcase-heading"><h2>Notification preferences</h2><p>A little less noise. The updates that matter.</p></header>
      <div class="showcase-stack">{#each [['Product updates', 'On'], ['Marketing emails', 'Off'], ['Helpful tips', 'On']] as [label, value]}<div class="showcase-row"><span class="showcase-label">{label}</span><span class="showcase-description">{value}</span></div>{/each}</div>
      <Dialog.Root><Dialog.Trigger class={`${c.button} showcase-open`}>Review preferences</Dialog.Trigger>
        {#if mounted}<div use:bodyPortal class={`showcase-portal ${theme}`} data-portal-owner="svelte" data-theme={view.theme}>
          <Dialog.Backdrop class={c.dialogBackdrop}/><Dialog.Positioner class={c.dialogPositioner}><Dialog.Content class={c.dialogContent} data-demo-dialog="svelte">
            <div class={c.dialogHeader}><Dialog.Title class={c.dialogTitle}>Your preferences</Dialog.Title><Dialog.Description class={c.dialogDescription}>Demo only. No settings are sent or stored.</Dialog.Description></div>
            <p>Marketing: off · Updates: on · Tips: on</p>
            <div class={c.dialogFooter}><Dialog.CloseTrigger class={c.button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content></Dialog.Positioner>
        </div>{/if}
      </Dialog.Root>
    </section>
  {/if}
</main>
