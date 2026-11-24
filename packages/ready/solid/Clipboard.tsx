import { createEffect, createMemo, createSignal, createUniqueId, on, onCleanup, onMount } from 'solid-js'
import { Clipboard as Primitive } from '@destyler-ui/solid/clipboard'
import { attachClipboard, clipboardStatus, clipboardText, type ClipboardPhase, type ClipboardProps } from '../Clipboard'

export function Clipboard(props: ClipboardProps) {
  let root: HTMLDivElement | undefined
  let controller: ReturnType<typeof attachClipboard> | undefined
  const id = createUniqueId()
  const [phase, setPhase] = createSignal<ClipboardPhase>('idle')
  const state = createMemo(() => clipboardText(props))
  onMount(() => {
    if (!root) return
    const instance = attachClipboard(root, setPhase)
    controller = instance
    onCleanup(() => instance.dispose())
  })
  createEffect(on(() => props.value, () => controller?.invalidate(), { defer: true }))
  return <div ref={root} class="rd-component rd-clipboard">
    <Primitive.Root ids={{ input: id }} value={state().value}>
      <Primitive.Label>{state().label}</Primitive.Label>
      <Primitive.Control>
        <input id={id} type="text" readOnly value={state().value} data-rd-copy-value="" />
        <button class="rd-button" type="button" data-rd-copy-button="" disabled={state().value === ''} aria-disabled={phase() === 'pending' || undefined}>{state().copyLabel}</button>
      </Primitive.Control>
      <div role="status" aria-live="polite">{clipboardStatus(phase(), state())}</div>
    </Primitive.Root>
  </div>
}
