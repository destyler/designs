import { For, createMemo } from 'solid-js'
import { ToggleGroup as Primitive } from '@destyler-ui/solid/toggle-group'
import { toggleGroupModel, type ToggleGroupProps } from '../ToggleGroup'

export type { ToggleGroupItem, ToggleGroupProps } from '../ToggleGroup'

export function ToggleGroup(props: ToggleGroupProps) {
  const model = createMemo(() => toggleGroupModel(props))
  return <div class="rd-component rd-toggle-group">
    <Primitive.Root aria-label={model().label} aria-disabled={model().disabled || undefined}
      {...(model().disabled ? { tabIndex: -1 } : {})} multiple rovingFocus value={model().value}
      defaultValue={model().defaultValue} disabled={model().disabled} orientation={props.orientation}
      loopFocus={props.loopFocus} onValueChange={({ value }) => props.onValueChange?.(value)}>
      <For each={props.items}>{item => <Primitive.Item value={item.value} disabled={item.disabled}>{item.label}</Primitive.Item>}</For>
    </Primitive.Root>
  </div>
}
