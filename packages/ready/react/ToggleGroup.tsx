import { ToggleGroup as Primitive } from '@destyler-ui/react'
import { toggleGroupModel, type ToggleGroupProps } from '../ToggleGroup'

export type { ToggleGroupItem, ToggleGroupProps } from '../ToggleGroup'

export function ToggleGroup(props: ToggleGroupProps) {
  const model = toggleGroupModel(props)
  return <div className="rd-component rd-toggle-group">
    <Primitive.Root aria-label={model.label} aria-disabled={model.disabled || undefined}
      {...(model.disabled ? { tabIndex: -1 } : {})} multiple rovingFocus value={model.value}
      defaultValue={model.defaultValue} disabled={model.disabled} orientation={props.orientation}
      loopFocus={props.loopFocus} onValueChange={({ value }) => props.onValueChange?.(value)}>
      {props.items.map(item => <Primitive.Item key={item.value} value={item.value} disabled={item.disabled}>{item.label}</Primitive.Item>)}
    </Primitive.Root>
  </div>
}
