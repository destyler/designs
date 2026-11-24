import { validateAccessibleText } from './accessible-text'

/** A single native text input, not a wrapper around another Ready control. */
export type FieldProps = {
  label: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  placeholder?: string
  autoComplete?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function fieldText(id: string, label: string, description?: string, error?: string) {
  const ids = { helperText: `${id}-help`, errorText: `${id}-error` }
  description = description?.trim() ? description : undefined
  error = error?.trim() ? error : undefined
  return {
    label: validateAccessibleText(label, 'Field', 'label'),
    ids, description, error,
    describedBy: [description && ids.helperText, error && ids.errorText].filter(Boolean).join(' ') || undefined,
  }
}
