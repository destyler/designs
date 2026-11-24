import { createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { Tooltip as Primitive } from '@destyler-ui/solid/tooltip'
import { attachTooltipPolicy, tooltipPositioning, tooltipText, type TooltipProps } from '../Tooltip'

export function Tooltip(props: TooltipProps) {
  let root: HTMLDivElement | undefined
  const [open, setOpen] = createSignal(false)
  const copy = createMemo(() => tooltipText(props))
  onMount(() => { if (root) onCleanup(attachTooltipPolicy(root, setOpen)) })
  return <div ref={root} class="rd-component rd-tooltip">
    <Primitive.Root open={open()} interactive closeOnEscape={false} closeOnClick={false} closeOnPointerDown={false} closeOnScroll={false}
      lazyMount={false} unmountOnExit={false} positioning={tooltipPositioning}>
      <Primitive.Trigger type="button" class="rd-button">{copy().trigger}</Primitive.Trigger>
      <Primitive.Positioner><Primitive.Content>{copy().text}</Primitive.Content></Primitive.Positioner>
    </Primitive.Root>
  </div>
}
