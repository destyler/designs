<script lang="ts">
  import { onMount } from 'svelte'
  import { Clipboard as Primitive } from '@destyler-ui/svelte/clipboard'
  import { attachClipboard, clipboardStatus, clipboardText, type ClipboardPhase, type ClipboardProps } from '../Clipboard'

  let { label, value, copyLabel, pendingMessage, copiedMessage, errorMessage }: ClipboardProps = $props()
  let root: HTMLDivElement
  let controller: ReturnType<typeof attachClipboard> | undefined
  const id = $props.id()
  let phase = $state<ClipboardPhase>('idle')
  const copy = $derived(clipboardText({ label, value, copyLabel, pendingMessage, copiedMessage, errorMessage }))
  onMount(() => {
    const instance = attachClipboard(root, next => { phase = next })
    controller = instance
    return () => instance.dispose()
  })
  function invalidate(_value: string) { controller?.invalidate() }
  $effect(() => invalidate(value))
</script>

<div bind:this={root} class="rd-component rd-clipboard">
  <Primitive.Root ids={{ input: id }} value={copy.value}>
    <Primitive.Label>{copy.label}</Primitive.Label>
    <Primitive.Control>
      <input {id} type="text" readonly value={copy.value} data-rd-copy-value="" />
      <button class="rd-button" type="button" data-rd-copy-button="" disabled={copy.value === ''} aria-disabled={phase === 'pending' || undefined}>{copy.copyLabel}</button>
    </Primitive.Control>
    <div role="status" aria-live="polite">{clipboardStatus(phase, copy)}</div>
  </Primitive.Root>
</div>
