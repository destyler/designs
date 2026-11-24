import { createMemo, For, type JSX } from 'solid-js'
import { Collapse as Primitive } from '@destyler-ui/solid/collapse'
import { collapseItems, collapseValue } from '../Collapse'
import type { CollapseItem, CollapseProps } from '../Collapse'

export type { CollapseItem, CollapseProps } from '../Collapse'

export function Collapse(props: CollapseProps & { renderPanel?: (item: CollapseItem) => JSX.Element }) {
  const known = createMemo(() => collapseItems(props.items))
  return <div class="rd-component">
    <Primitive.Root value={collapseValue(known(), props.multiple, props.value)}
      defaultValue={props.value === undefined ? collapseValue(known(), props.multiple, props.defaultValue) : undefined}
      multiple={props.multiple} collapsible={props.collapsible} disabled={props.disabled} orientation={props.orientation ?? 'vertical'}
      onValueChange={event => props.onValueChange?.([...event.value])}>
      <For each={props.items}>{item => <Primitive.Item value={item.value} disabled={Boolean(props.disabled || item.disabled)}>
        <div class="rd-collapse-heading" role="heading" aria-level={props.headingLevel ?? 3}>
          <Primitive.ItemTrigger>
            <span>{item.label}</span>
            <Primitive.ItemIndicator>⌄</Primitive.ItemIndicator>
          </Primitive.ItemTrigger>
        </div>
        <Primitive.ItemContent>{props.renderPanel ? props.renderPanel(item) : item.content}</Primitive.ItemContent>
      </Primitive.Item>}</For>
    </Primitive.Root>
  </div>
}
