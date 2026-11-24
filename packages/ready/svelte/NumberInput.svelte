<script lang="ts">
  import { NumberInput as Primitive } from '@destyler-ui/svelte/number-input'
  import { useFieldContext } from '@destyler-ui/svelte/field'
  import { numberInputOptions, type NumberInputProps } from '../NumberInput'
  import { describeField } from '../switch-description'

  let { label, description, error, name, form, value, defaultValue, min, max, step, disabled, required, readOnly, onValueChange }: NumberInputProps = $props()
  const field = useFieldContext()
  const id = $props.id()
  let root: HTMLDivElement
  const options = $derived(numberInputOptions({ label, min, max, step }))
  const text = $derived(describeField(id, description, error, field?.()?.ariaDescribedby))
  $effect(() => { root?.querySelector('input')?.setCustomValidity(error ?? '') })
</script>

<div bind:this={root} class="rd-component">
  <Primitive.Root {...options} {name} {form} {value} {defaultValue} {disabled} {required} {readOnly}
    invalid={Boolean(error) || field?.()?.invalid} onValueChange={event => onValueChange?.(event.value)}>
    <Primitive.Label>{label}</Primitive.Label>
    <Primitive.Control>
      <Primitive.DecrementTrigger><span aria-hidden="true">−</span></Primitive.DecrementTrigger>
      <Primitive.Input aria-describedby={text.describedBy} />
      <Primitive.IncrementTrigger><span aria-hidden="true">+</span></Primitive.IncrementTrigger>
    </Primitive.Control>
  </Primitive.Root>
  {#if text.hasDescription}<p id={text.descriptionId} class="rd-description">{description}</p>{/if}
  {#if error}<p id={text.errorId} class="rd-error">{error}</p>{/if}
</div>
