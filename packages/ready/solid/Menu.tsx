import { createMemo, createUniqueId, For, onCleanup } from 'solid-js'
import { Menu as Primitive } from '@destyler-ui/solid/menu'
import { allowMenuTab, emitMenuSelection, matchMenuClick, menuPosition, prepareMenu, preserveMenuOutsideFocus, type MenuProps } from '../Menu'

export function Menu(props: MenuProps) {
  const id = createUniqueId()
  const entries = createMemo(() => prepareMenu(props.trigger, props.items, id))
  return <Primitive.Root positioning={menuPosition} closeOnSelect loopFocus
    onSelect={event => emitMenuSelection(entries(), event.value, props.onSelect)}
    onOpenChange={event => props.onOpenChange?.(event.open)} onFocusOutside={preserveMenuOutsideFocus}>
    <Primitive.Context>{api => <div class="rd-component rd-menu" ref={element => {
      const click = (event: MouseEvent) => matchMenuClick(event, api())
      element.addEventListener('click', click, true)
      element.addEventListener('keydown', allowMenuTab, true)
      onCleanup(() => {
        element.removeEventListener('click', click, true)
        element.removeEventListener('keydown', allowMenuTab, true)
      })
    }}>
      <Primitive.Trigger disabled={entries().every(item => item.disabled)}>
        {props.trigger}<span aria-hidden="true">⌄</span>
      </Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content>
          <For each={entries()}>{item => <Primitive.Item value={item.id} valueText={item.label} disabled={item.disabled}>
            {item.label}
          </Primitive.Item>}</For>
        </Primitive.Content>
      </Primitive.Positioner>
    </div>}</Primitive.Context>
  </Primitive.Root>
}
