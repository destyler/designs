import { useLayoutEffect, useId, useRef, useState } from 'react'
import { Clipboard as Primitive } from '@destyler-ui/react'
import { attachClipboard, clipboardStatus, clipboardText, type ClipboardPhase, type ClipboardProps } from '../Clipboard'

export function Clipboard(props: ClipboardProps) {
  const root = useRef<HTMLDivElement>(null)
  const controller = useRef<ReturnType<typeof attachClipboard> | null>(null)
  const id = useId()
  const [phase, setPhase] = useState<ClipboardPhase>('idle')
  const state = clipboardText(props)
  useLayoutEffect(() => {
    if (!root.current) return
    const instance = attachClipboard(root.current, setPhase)
    controller.current = instance
    return () => { instance.dispose(); controller.current = null }
  }, [])
  useLayoutEffect(() => { controller.current?.invalidate() }, [props.value])
  return <div ref={root} className="rd-component rd-clipboard">
    <Primitive.Root ids={{ input: id }} value={state.value}>
      <Primitive.Label>{state.label}</Primitive.Label>
      <Primitive.Control>
        <input id={id} type="text" readOnly value={state.value} data-rd-copy-value="" />
        <button className="rd-button" type="button" data-rd-copy-button="" disabled={state.value === ''} aria-disabled={phase === 'pending' || undefined}>{state.copyLabel}</button>
      </Primitive.Control>
      <div role="status" aria-live="polite">{clipboardStatus(phase, state)}</div>
    </Primitive.Root>
  </div>
}
