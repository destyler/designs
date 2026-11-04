<script lang="ts">
  import { onMount } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'

  let { colorMode }: { colorMode: 'light' | 'dark' } = $props()
  let mounted = $state(false)
  onMount(() => { mounted = true })
  const theme = $derived(themes[colorMode])
  function bodyPortal(node: HTMLElement) {
    document.body.appendChild(node)
    return { destroy() { node.remove() } }
  }
</script>

<Dialog.Root>
  <Dialog.Trigger class={c.button}>Open dialog</Dialog.Trigger>
  {#if mounted}
    <div use:bodyPortal class={`showcase-portal ${theme}`} data-portal-owner="svelte" data-theme={colorMode}>
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
