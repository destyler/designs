import type { ReactNode } from 'react'
import { ScrollArea as Primitive } from '@destyler-ui/react'
import { scrollAreaOptions, type ScrollAreaProps } from '../ScrollArea'

export function ScrollArea(props: ScrollAreaProps & { children?: ReactNode }) {
  const { label, orientation, style } = scrollAreaOptions(props)
  return <Primitive.Root className="rd-component rd-scroll-area">
    <Primitive.Viewport role="region" aria-label={label} style={style} data-rd-orientation={orientation}>
      <Primitive.Content>{props.children}</Primitive.Content>
    </Primitive.Viewport>
  </Primitive.Root>
}
