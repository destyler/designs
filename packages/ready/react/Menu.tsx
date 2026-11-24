import { useId } from 'react'
import { Menu as Primitive } from '@destyler-ui/react'
import { allowMenuTab, emitMenuSelection, matchMenuClick, menuPosition, prepareMenu, preserveMenuOutsideFocus, type MenuProps } from '../Menu'

export function Menu({ trigger, items, onSelect, onOpenChange }: MenuProps) {
  const id = useId()
  const entries = prepareMenu(trigger, items, id)
  return <Primitive.Root positioning={menuPosition} closeOnSelect loopFocus
    onSelect={event => emitMenuSelection(entries, event.value, onSelect)}
    onOpenChange={event => onOpenChange?.(event.open)} onFocusOutside={preserveMenuOutsideFocus}>
    <Primitive.Context>{api => <div className="rd-component rd-menu"
      onClickCapture={event => matchMenuClick(event, api)} onKeyDownCapture={allowMenuTab}>
      <Primitive.Trigger disabled={entries.every(item => item.disabled)}>
        {trigger}<span aria-hidden="true">⌄</span>
      </Primitive.Trigger>
      <Primitive.Positioner>
        <Primitive.Content>
          {entries.map(item => <Primitive.Item key={item.id} value={item.id} valueText={item.label} disabled={item.disabled}>
            {item.label}
          </Primitive.Item>)}
        </Primitive.Content>
      </Primitive.Positioner>
    </div>}</Primitive.Context>
  </Primitive.Root>
}
