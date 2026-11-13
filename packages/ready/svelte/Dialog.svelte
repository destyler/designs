<script lang="ts">
  import { validateAccessibleText } from '../accessible-text'
  import type { Snippet } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  let { trigger, title, description, open, onOpenChange, children }: { trigger: string; title: string; description?: string; open?: boolean; onOpenChange?: (value: boolean) => void; children?: Snippet } = $props()
  let local = $state(false)
  // Own the optional description link; primitive presence detection runs only on open.
  const descriptionId = $props.id()
  const accessibleTrigger=$derived(validateAccessibleText(trigger,'Dialog','trigger'))
  const accessibleTitle=$derived(validateAccessibleText(title,'Dialog','title'))
</script>
<div class="rd-component"><Dialog.Root open={open ?? local} onOpenChange={details => { local = details.open; onOpenChange?.(local) }}>
  <Dialog.Trigger class="rd-button">{accessibleTrigger}</Dialog.Trigger><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content aria-describedby={description ? descriptionId : undefined}><Dialog.Title>{accessibleTitle}</Dialog.Title>{#if description}<Dialog.Description id={descriptionId}>{description}</Dialog.Description>{/if}<div class="rd-dialog-body">{@render children?.()}</div><Dialog.CloseTrigger class="rd-button">Close</Dialog.CloseTrigger></Dialog.Content></Dialog.Positioner>
</Dialog.Root></div>
