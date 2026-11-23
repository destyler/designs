<script lang="ts">
  import { Radio as Primitive } from '@destyler-ui/svelte/radio'
  import { radioItemIds, validateRadioGroup, type RadioGroupProps } from '../RadioGroup'

  let { label, items, value, defaultValue, disabled, name, required, orientation, onValueChange }: RadioGroupProps = $props()
  const id = $props.id()
  const ids = radioItemIds(id)
  const options = $derived(validateRadioGroup(label, items))
</script>

<Primitive.Root class="rd-component rd-radio-group" {ids} {value} {defaultValue} {disabled} {name}
  {orientation} aria-required={required || undefined} aria-disabled={disabled || undefined}
  onValueChange={event => onValueChange?.(event.value)}>
  <Primitive.Label>{label}</Primitive.Label>
  <div class="rd-radio-group-items">
    {#each options as item (item.value)}
      <Primitive.Item value={item.value} disabled={item.disabled}>
        <Primitive.ItemControl />
        <Primitive.ItemText>{item.label}</Primitive.ItemText>
        <Primitive.ItemHiddenInput {required} />
      </Primitive.Item>
    {/each}
  </div>
</Primitive.Root>
