<script lang="ts">
  import type { DialogRootProps } from '@destyler-ui/svelte/dialog'
  import { portal } from '@destyler-ui/svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'

  const props: DialogRootProps = $props()
  let open = $state(false)
</script>

<Dialog.Root bind:open {...props}>
  <Dialog.Trigger class="parity-button">Open Dialog</Dialog.Trigger>
  <div use:portal>
    <Dialog.Backdrop />
    <Dialog.Positioner data-testid="positioner">
      <Dialog.Content><button type="button" class="parity-dialog-close" aria-label="Close" onclick={() => open = false}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12" /></svg></button>
        <div class="parity-dialog-header"><Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Description>Dialog Description</Dialog.Description></div>
        <div class="parity-dialog-footer"><Dialog.CloseTrigger class="parity-button">Cancel</Dialog.CloseTrigger></div>
      </Dialog.Content>
    </Dialog.Positioner>
  </div>
</Dialog.Root>
