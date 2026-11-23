import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { FloatingPanel as Primitive } from '@destyler-ui/react'
import { connectFloatingPanelFocus, floatingPanelGeometry, floatingPanelText, type FloatingPanelProps } from '../FloatingPanel'

export type { FloatingPanelProps } from '../FloatingPanel'

export function FloatingPanel({ trigger, title, moveHint, closeLabel, open, defaultOpen, onOpenChange, children }:
  FloatingPanelProps & { children?: ReactNode }) {
  const text = floatingPanelText(trigger, title, moveHint, closeLabel)
  const id = useId()
  const ids = { title: `${id}-title` }
  const hintId = `${id}-movement`
  const [localOpen, setLocalOpen] = useState(defaultOpen ?? false)
  // The locked React hook reapplies supplied geometry on each snapshot.
  // Reflect native updates so it cannot overwrite a move with the initial rectangle.
  const [position, setPosition] = useState(floatingPanelGeometry.position)
  const [size, setSize] = useState(floatingPanelGeometry.size)
  const expanded = open ?? localOpen
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => root.current ? connectFloatingPanelFocus(root.current) : undefined, [])

  return <div className="rd-component rd-floating-panel" ref={root}>
    <Primitive.Root {...floatingPanelGeometry} ids={ids} position={position} size={size} open={expanded} closeOnEscape allowOverflow={false} resizable={false}
      onPositionChange={event => setPosition(event.position)} onSizeChange={event => setSize(event.size)}
      onOpenChange={({ open: next }) => { if (open === undefined) setLocalOpen(next); onOpenChange?.(next) }}>
      <Primitive.Trigger className="rd-button" aria-haspopup="dialog" aria-expanded={expanded}>{text.trigger}</Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content aria-describedby={hintId}>
          <Primitive.Header>
            <Primitive.DragTrigger><Primitive.Title>{text.title}</Primitive.Title></Primitive.DragTrigger>
            <Primitive.CloseTrigger className="rd-button">{text.closeLabel}</Primitive.CloseTrigger>
          </Primitive.Header>
          <p id={hintId} className="rd-floating-panel-hint">{text.moveHint}</p>
          <Primitive.Body>{children}</Primitive.Body>
        </Primitive.Content>
      </Primitive.Positioner>
    </Primitive.Root>
  </div>
}
