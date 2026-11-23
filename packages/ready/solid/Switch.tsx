import { createEffect, createMemo, createUniqueId, Show } from 'solid-js'
import { Switch as Primitive } from '@destyler-ui/solid/switch'
import { useFieldContext } from '@destyler-ui/solid/field'
import { validateAccessibleText } from '../accessible-text'
import { describeField } from '../switch-description'
import type { SwitchProps } from '../types'

export function Switch(props: SwitchProps) {
  const id = createUniqueId()
  const field = useFieldContext()
  let input: HTMLInputElement | undefined
  const text = createMemo(() => describeField(id, props.description, props.error, field?.()?.ariaDescribedby))
  createEffect(() => input?.setCustomValidity(props.error ?? ''))
  return <div class="rd-component">
    <Primitive.Root checked={props.checked} defaultChecked={props.defaultChecked} disabled={props.disabled} required={props.required}
      name={props.name} value={props.value} invalid={Boolean(props.error) || field?.()?.invalid}
      onCheckedChange={event => props.onCheckedChange?.(event.checked)}>
      <Primitive.Control><Primitive.Thumb /></Primitive.Control>
      <Primitive.Label>{validateAccessibleText(props.label, 'Switch', 'label')}</Primitive.Label>
      <Primitive.HiddenInput ref={input} role="switch" aria-describedby={text().describedBy} />
    </Primitive.Root>
    <Show when={text().hasDescription}><p id={text().descriptionId} class="rd-description">{props.description}</p></Show>
    <Show when={props.error}><p id={text().errorId} class="rd-error">{props.error}</p></Show>
  </div>
}
