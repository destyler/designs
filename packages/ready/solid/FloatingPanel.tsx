import { createSignal, createUniqueId, onCleanup, onMount, type JSX } from 'solid-js'
import { FloatingPanel as Primitive } from '@destyler-ui/solid/floating-panel'
import { connectFloatingPanelFocus, floatingPanelGeometry, floatingPanelText, type FloatingPanelProps } from '../FloatingPanel'

export type { FloatingPanelProps } from '../FloatingPanel'

export function FloatingPanel(props: FloatingPanelProps & { children?: JSX.Element }) {
  const text = () => floatingPanelText(props.trigger, props.title, props.moveHint, props.closeLabel)
  const id = createUniqueId()
  const ids = { title: `${id}-title` }
  const hintId = `${id}-movement`
  const [localOpen, setLocalOpen] = createSignal(props.defaultOpen ?? false)
  const expanded = () => props.open ?? localOpen()
  let root: HTMLDivElement | undefined
  onMount(() => { if (root) onCleanup(connectFloatingPanelFocus(root)) })

  return <div class="rd-component rd-floating-panel" ref={root}>
    <Primitive.Root {...floatingPanelGeometry} ids={ids} open={expanded()} closeOnEscape allowOverflow={false} resizable={false}
      onOpenChange={({ open: next }) => { if (props.open === undefined) setLocalOpen(next); props.onOpenChange?.(next) }}>
      <Primitive.Trigger class="rd-button" aria-haspopup="dialog" aria-expanded={expanded()}>{text().trigger}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content aria-describedby={hintId}>
          <Primitive.Header>
            <Primitive.DragTrigger><Primitive.Title>{text().title}</Primitive.Title></Primitive.DragTrigger>
            <Primitive.CloseTrigger class="rd-button">{text().closeLabel}</Primitive.CloseTrigger>
          </Primitive.Header>
          <p id={hintId} class="rd-floating-panel-hint">{text().moveHint}</p>
          <Primitive.Body>{props.children}</Primitive.Body>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
}
