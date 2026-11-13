<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  let { trigger, title, description, open, onOpenChange, children }: { trigger: string; title: string; description?: string; open?: boolean; onOpenChange?: (value: boolean) => void; children?: Snippet } = $props()
  let local = $state(false)
</script>
<div class="rd-component"><Dialog.Root open={open ?? local} onOpenChange={details => { local = details.open; onOpenChange?.(local) }}>
  <Dialog.Trigger class="rd-button">{trigger}</Dialog.Trigger><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Title>{title}</Dialog.Title>{#if description}<Dialog.Description>{description}</Dialog.Description>{/if}<div class="rd-dialog-body">{@render children?.()}</div><Dialog.CloseTrigger class="rd-button">Close</Dialog.CloseTrigger></Dialog.Content></Dialog.Positioner>
</Dialog.Root></div>
