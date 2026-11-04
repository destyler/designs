<script lang="ts">
  import { onMount } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  import { Switch } from '@destyler-ui/svelte/switch'
  import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
  import { connectShowcase, initialShowcaseState } from '../shared/showcase'
  import '@fontsource-variable/geist'
  import '../shared/showcase.css'

  let view = $state(initialShowcaseState())
  let checked = $state(false)
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
    <Switch.Root {checked} onCheckedChange={details => { checked = details.checked }} class={c.switchRoot}>
      <Switch.Label class="showcase-sr-only">Airplane mode</Switch.Label>
      <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control>
      <Switch.HiddenInput role="switch"/>
    </Switch.Root>
  {:else}
    <Dialog.Root>
      <Dialog.Trigger class={c.button}>Open dialog</Dialog.Trigger>
      {#if mounted}
        <div use:bodyPortal class={`showcase-portal ${theme}`} data-portal-owner="svelte" data-theme={view.theme}>
          <Dialog.Backdrop class={c.dialogBackdrop}/>
          <Dialog.Positioner class={c.dialogPositioner}>
            <Dialog.Content class={c.dialogContent} data-demo-dialog="svelte">
              <div class={c.dialogHeader}>
                <Dialog.Title class={c.dialogTitle}>Dialog title</Dialog.Title>
                <Dialog.Description class={c.dialogDescription}>This is a dialog description.</Dialog.Description>
              </div>
              <div class={c.dialogFooter}><Dialog.CloseTrigger class={c.button}>Close</Dialog.CloseTrigger></div>
            </Dialog.Content>
          </Dialog.Positioner>
        </div>
      {/if}
    </Dialog.Root>
  {/if}
</main>
