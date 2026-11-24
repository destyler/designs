import { createMemo, createUniqueId, For } from 'solid-js'
import { Radio as Primitive } from '@destyler-ui/solid/radio'
import { radioItemIds, validateRadioGroup, type RadioGroupProps } from '../RadioGroup'

export function RadioGroup(props: RadioGroupProps) {
  const ids = radioItemIds(createUniqueId())
  const options = createMemo(() => validateRadioGroup(props.label, props.items))
  return <Primitive.Root class="rd-component rd-radio-group" ids={ids} value={props.value} defaultValue={props.defaultValue}
    disabled={props.disabled} name={props.name} orientation={props.orientation} aria-required={props.required || undefined} aria-disabled={props.disabled || undefined}
    onValueChange={event => props.onValueChange?.(event.value)}>
    <Primitive.Label>{props.label}</Primitive.Label>
    <div class="rd-radio-group-items">
      <For each={options()}>{item => <Primitive.Item value={item.value} disabled={item.disabled}>
        <Primitive.ItemControl />
        <Primitive.ItemText>{item.label}</Primitive.ItemText>
        <Primitive.ItemHiddenInput required={props.required} />
      </Primitive.Item>}</For>
    </div>
  </Primitive.Root>
}
