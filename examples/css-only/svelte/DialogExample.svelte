<script lang="ts">
  import '@destyler/designs-css-only-poc/styles.css'
  import { onMount } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'

  let mounted = $state(false)
  onMount(() => { mounted = true })
  function bodyPortal(node: HTMLElement) {
    document.body.appendChild(node)
    return { destroy() { node.remove() } }
  }
</script>

<Dialog.Root>
  <Dialog.Trigger>Open dialog</Dialog.Trigger>
  {#if mounted}
    <div use:bodyPortal data-portal-owner="svelte">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content data-demo-dialog="svelte">
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>This is a dialog description.</Dialog.Description>
          <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </div>
  {/if}
</Dialog.Root>
