import { createMemo, For, type JSX } from 'solid-js'
import { Tabs as Primitive } from '@destyler-ui/solid/tabs'
import { validateTabs } from '../Tabs.model'
import type { TabsItem, TabsProps } from '../Tabs.types'

export type { TabsItem, TabsProps } from '../Tabs.types'

export function Tabs(props: TabsProps & { renderPanel?: (item: TabsItem) => JSX.Element }) {
  const initial = createMemo(() => validateTabs(props.label, props.items, props.value, props.defaultValue))
  return <div class="rd-component">
    <Primitive.Root value={props.value} defaultValue={initial()}
      orientation={props.orientation ?? 'horizontal'} activationMode={props.activationMode ?? 'automatic'} loopFocus composite
      onValueChange={event => { if (event.value !== null) props.onValueChange?.(event.value) }}>
      <Primitive.List aria-label={props.label}>
        <For each={props.items}>{item => <Primitive.Trigger value={item.value} disabled={item.disabled}>{item.label}</Primitive.Trigger>}</For>
      </Primitive.List>
      <For each={props.items}>{item => <Primitive.Content value={item.value}>
        {props.renderPanel ? props.renderPanel(item) : item.content}
      </Primitive.Content>}</For>
    </Primitive.Root>
  </div>
}
