import { createMemo, type JSX } from 'solid-js'
import { ScrollArea as Primitive } from '@destyler-ui/solid/scroll-area'
import { scrollAreaOptions, type ScrollAreaProps } from '../ScrollArea'

export function ScrollArea(props: ScrollAreaProps & { children?: JSX.Element }) {
  const options = createMemo(() => scrollAreaOptions(props))
  return <Primitive.Root class="rd-component rd-scroll-area">
    <Primitive.Viewport role="region" aria-label={options().label} data-rd-orientation={options().orientation} style={{
      height: options().style.height,
      'max-height': options().style.maxHeight,
      'overflow-x': options().style.overflowX,
      'overflow-y': options().style.overflowY,
      'scrollbar-width': options().style.scrollbarWidth,
    }}>
      <Primitive.Content>{props.children}</Primitive.Content>
    </Primitive.Viewport>
  </Primitive.Root>
}
