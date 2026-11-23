import { useId } from 'react'
import { Field as UI } from '@destyler-ui/react'
import { fieldText, type FieldProps } from '../Field'

export function Field({
  label, description, error, disabled, required, readOnly, onValueChange,
  value, defaultValue, ...input
}: FieldProps) {
  const text = fieldText(useId(), label, description, error)
  return <UI.Root className="rd-component rd-field" ids={text.ids} disabled={disabled}
    required={required} readOnly={readOnly} invalid={Boolean(text.error)}>
    <UI.Label>{text.label}</UI.Label>
    <UI.Input {...input} {...value === undefined ? { defaultValue } : { value }}
      aria-describedby={text.describedBy} onChange={event => onValueChange?.(event.currentTarget.value)} />
    {text.description && <UI.HelperText className="rd-description">{text.description}</UI.HelperText>}
    {text.error && <UI.ErrorText className="rd-error">{text.error}</UI.ErrorText>}
  </UI.Root>
}
