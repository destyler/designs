import { createEffect, createMemo, createUniqueId, Show } from 'solid-js'
import { NumberInput as Primitive } from '@destyler-ui/solid/number-input'
import { useFieldContext } from '@destyler-ui/solid/field'
import { numberInputOptions, type NumberInputProps } from '../NumberInput'
import { describeField } from '../switch-description'

export function NumberInput(props: NumberInputProps) {
  const id = createUniqueId()
  const field = useFieldContext()
  let input: HTMLInputElement | undefined
  const options = createMemo(() => numberInputOptions(props))
  const text = createMemo(() => describeField(id, props.description, props.error, field?.()?.ariaDescribedby))
  createEffect(() => input?.setCustomValidity(props.error ?? ''))
  return <div class="rd-component">
    <Primitive.Root {...options()} name={props.name} form={props.form} value={props.value} defaultValue={props.defaultValue}
      disabled={props.disabled} required={props.required} readOnly={props.readOnly}
      invalid={Boolean(props.error) || field?.()?.invalid} onValueChange={event => props.onValueChange?.(event.value)}>
      <Primitive.Label>{props.label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.DecrementTrigger><span aria-hidden="true">−</span></Primitive.DecrementTrigger>
        <Primitive.Input ref={input} aria-describedby={text().describedBy} />
        <Primitive.IncrementTrigger><span aria-hidden="true">+</span></Primitive.IncrementTrigger>
      </Primitive.Control>
    </Primitive.Root>
    <Show when={text().hasDescription}><p id={text().descriptionId} class="rd-description">{props.description}</p></Show>
    <Show when={props.error}><p id={text().errorId} class="rd-error">{props.error}</p></Show>
  </div>
}
