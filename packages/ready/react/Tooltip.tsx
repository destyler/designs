import { useEffect, useRef, useState } from 'react'
import { Tooltip as Primitive } from '@destyler-ui/react'
import { attachTooltipPolicy, tooltipPositioning, tooltipText, type TooltipProps } from '../Tooltip'

export function Tooltip(props: TooltipProps) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { trigger, text } = tooltipText(props)
  useEffect(() => root.current ? attachTooltipPolicy(root.current, setOpen) : undefined, [])
  return <div ref={root} className="rd-component rd-tooltip">
    <Primitive.Root open={open} interactive closeOnEscape={false} closeOnClick={false} closeOnPointerDown={false} closeOnScroll={false}
      lazyMount={false} unmountOnExit={false} positioning={tooltipPositioning}>
      <Primitive.Trigger type="button" className="rd-button">{trigger}</Primitive.Trigger>
      <Primitive.Positioner><Primitive.Content>{text}</Primitive.Content></Primitive.Positioner>
    </Primitive.Root>
  </div>
}
