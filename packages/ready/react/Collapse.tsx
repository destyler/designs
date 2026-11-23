import type { ReactNode } from 'react'
import { Collapse as Primitive } from '@destyler-ui/react'
import { collapseItems, collapseValue } from '../Collapse'
import type { CollapseItem, CollapseProps } from '../Collapse'

export type { CollapseItem, CollapseProps } from '../Collapse'

export function Collapse({
  items, value, defaultValue, multiple, collapsible, disabled,
  orientation = 'vertical', headingLevel = 3, onValueChange, renderPanel,
}: CollapseProps & { renderPanel?: (item: CollapseItem) => ReactNode }) {
  const known = collapseItems(items)
  return <div className="rd-component">
    <Primitive.Root value={collapseValue(known, multiple, value)}
      defaultValue={value === undefined ? collapseValue(known, multiple, defaultValue) : undefined}
      multiple={multiple} collapsible={collapsible} disabled={disabled} orientation={orientation}
      onValueChange={event => onValueChange?.([...event.value])}>
      {items.map(item => <Primitive.Item key={item.value} value={item.value} disabled={Boolean(disabled || item.disabled)}>
        <div className="rd-collapse-heading" role="heading" aria-level={headingLevel}>
          <Primitive.ItemTrigger>
            <span>{item.label}</span>
            <Primitive.ItemIndicator>⌄</Primitive.ItemIndicator>
          </Primitive.ItemTrigger>
        </div>
        <Primitive.ItemContent>{renderPanel ? renderPanel(item) : item.content}</Primitive.ItemContent>
      </Primitive.Item>)}
    </Primitive.Root>
  </div>
}
