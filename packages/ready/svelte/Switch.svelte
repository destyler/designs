<script lang="ts">
  import { Switch as Primitive } from '@destyler-ui/svelte/switch'
  import { useFieldContext } from '@destyler-ui/svelte/field'
  import { validateAccessibleText } from '../accessible-text'
  import { describeField } from '../switch-description'
  import type { SwitchProps } from '../types'

  let { label, description, error, checked, defaultChecked, disabled, required, name, value, onCheckedChange }: SwitchProps = $props()
  const field = useFieldContext()
  const id = $props.id()
  let element: HTMLDivElement
  const text = $derived(describeField(id, description, error, field?.()?.ariaDescribedby))
  $effect(() => { element?.querySelector('input')?.setCustomValidity(error ?? '') })
</script>

<div bind:this={element} class="rd-component">
  <Primitive.Root {checked} {defaultChecked} {disabled} {required} {name} {value}
    invalid={Boolean(error) || field?.()?.invalid} onCheckedChange={event => onCheckedChange?.(event.checked)}>
    <Primitive.Control><Primitive.Thumb /></Primitive.Control>
    <Primitive.Label>{validateAccessibleText(label, 'Switch', 'label')}</Primitive.Label>
    <Primitive.HiddenInput role="switch" aria-describedby={text.describedBy} />
  </Primitive.Root>
  {#if text.hasDescription}<p id={text.descriptionId} class="rd-description">{description}</p>{/if}
  {#if error}<p id={text.errorId} class="rd-error">{error}</p>{/if}
</div>
