import { createMemo, createUniqueId, Show } from 'solid-js'
import { Field as UI } from '@destyler-ui/solid/field'
import { fieldText, type FieldProps } from '../Field'

export function Field(props: FieldProps) {
  const id = createUniqueId()
  const text = createMemo(() => fieldText(id, props.label, props.description, props.error))
  const initial = props.defaultValue
  return <UI.Root class="rd-component rd-field" ids={text().ids} disabled={props.disabled}
    required={props.required} readOnly={props.readOnly} invalid={Boolean(text().error)}>
    <UI.Label>{text().label}</UI.Label>
    <UI.Input name={props.name} type={props.type} placeholder={props.placeholder} autocomplete={props.autoComplete}
      value={props.value ?? initial} ref={node => { if (initial !== undefined) node.defaultValue = initial }} aria-describedby={text().describedBy}
      onInput={event => {
        const node = event.currentTarget
        props.onValueChange?.(node.value)
        queueMicrotask(() => { if (node.isConnected && props.value !== undefined) node.value = props.value })
      }} />
    <Show when={text().description}><UI.HelperText class="rd-description">{text().description}</UI.HelperText></Show>
    <Show when={text().error}><UI.ErrorText class="rd-error">{text().error}</UI.ErrorText></Show>
  </UI.Root>
}
