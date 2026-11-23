import { useId, useMemo } from 'react'
import { Radio as Primitive } from '@destyler-ui/react'
import { radioItemIds, validateRadioGroup, type RadioGroupProps } from '../RadioGroup'

export function RadioGroup({ label, items, value, defaultValue, disabled, name, required, orientation,
  onValueChange }: RadioGroupProps) {
  const id = useId()
  const ids = useMemo(() => radioItemIds(id), [id])
  const options = validateRadioGroup(label, items)
  return <Primitive.Root className="rd-component rd-radio-group" ids={ids} value={value} defaultValue={defaultValue}
    disabled={disabled} name={name} orientation={orientation} aria-required={required || undefined} aria-disabled={disabled || undefined}
    onValueChange={event => onValueChange?.(event.value)}>
    <Primitive.Label>{label}</Primitive.Label>
    <div className="rd-radio-group-items">
      {options.map(item => <Primitive.Item key={item.value} value={item.value} disabled={item.disabled}>
        <Primitive.ItemControl />
        <Primitive.ItemText>{item.label}</Primitive.ItemText>
        <Primitive.ItemHiddenInput required={required} />
      </Primitive.Item>)}
    </div>
  </Primitive.Root>
}
