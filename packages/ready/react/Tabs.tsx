import type { ReactNode } from 'react'
import { Tabs as Primitive } from '@destyler-ui/react'
import { validateTabs } from '../Tabs.model'
import type { TabsItem, TabsProps } from '../Tabs.types'

export type { TabsItem, TabsProps } from '../Tabs.types'

export function Tabs({
  label, items, value, defaultValue,
  orientation = 'horizontal', activationMode = 'automatic',
  onValueChange, renderPanel,
}: TabsProps & { renderPanel?: (item: TabsItem) => ReactNode }) {
  const initial = validateTabs(label, items, value, defaultValue)
  return <div className="rd-component">
    <Primitive.Root {...value === undefined ? {} : { value }} defaultValue={initial}
      orientation={orientation} activationMode={activationMode} loopFocus composite
      onValueChange={event => { if (event.value !== null) onValueChange?.(event.value) }}>
      <Primitive.List aria-label={label}>
        {items.map(item => <Primitive.Trigger key={item.value} value={item.value} disabled={item.disabled}>{item.label}</Primitive.Trigger>)}
      </Primitive.List>
      {items.map(item => <Primitive.Content key={item.value} value={item.value}>
        {renderPanel ? renderPanel(item) : item.content}
      </Primitive.Content>)}
    </Primitive.Root>
  </div>
}
