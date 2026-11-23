import { validateAccessibleText } from './accessible-text'

export interface ColorPickerProps {
  label: string
  /** An opaque color in #RRGGBB format, when controlled. */
  value?: string
  defaultValue?: string
  presets?: readonly string[]
  disabled?: boolean
  onValueChange?: (hex: string) => void
}

function hex(value: string) {
  return value.length === 7 && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : undefined
}

function requireHex(input: string, prop: string) {
  const parsed = typeof input === 'string' ? hex(input) : undefined
  if (parsed === undefined) throw new TypeError(`Ready ColorPicker: ${prop} must be an opaque #RRGGBB color.`)
  return parsed
}

export function initialColor(defaultValue = '#000000') {
  return requireHex(defaultValue, 'defaultValue')
}

export function colorPickerModel(props: Omit<ColorPickerProps, 'onValueChange'>, local: string) {
  return {
    label: validateAccessibleText(props.label, 'ColorPicker', 'label'),
    color: props.value === undefined ? local : requireHex(props.value, 'value'),
    presets: [...new Set(props.presets?.map(value => requireHex(value, 'presets')))],
  }
}

export function commitColorInput(input: HTMLInputElement, current: string, change: (hex: string) => void) {
  const next = hex(input.value.trim())
  // Restore the authoritative value even when the parent vetoes the proposal
  // without changing props. Accepting it will update this field on render.
  input.value = current
  if (next !== undefined && next !== current && !input.disabled) change(next)
}

export function handleColorInputKey(event: KeyboardEvent, input: HTMLInputElement, current: string, change: (hex: string) => void) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || input.disabled) return
  if (event.key === 'Enter') {
    event.preventDefault()
    commitColorInput(input, current, change)
  } else if (event.key === 'Escape' && input.value !== current) {
    event.preventDefault()
    input.value = current
  }
}
