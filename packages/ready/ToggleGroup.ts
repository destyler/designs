import { validateAccessibleText } from './accessible-text'

export interface ToggleGroupItem {
  /** Stable, unique, nonempty identifier without whitespace. */
  value: string
  label: string
  disabled?: boolean
}

export interface ToggleGroupProps {
  label: string
  items: readonly ToggleGroupItem[]
  /** Independently pressed items, owned by the parent when provided. */
  value?: readonly string[]
  /** Initial independently pressed items for an uncontrolled group. */
  defaultValue?: readonly string[]
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  loopFocus?: boolean
  onValueChange?: (value: string[]) => void
}

export function toggleGroupModel(props: ToggleGroupProps) {
  const label = validateAccessibleText(props.label, 'ToggleGroup', 'label')
  if (!props.items.length) throw new Error('Ready ToggleGroup: provide at least one item.')
  const known = new Set<string>()
  for (const item of props.items) {
    if (typeof item.value !== 'string' || !item.value || /\s/.test(item.value) || known.has(item.value)) {
      throw new Error('Ready ToggleGroup: item values must be unique, nonempty and contain no whitespace.')
    }
    validateAccessibleText(item.label, 'ToggleGroup', 'item.label')
    known.add(item.value)
  }
  function validate(value?: readonly string[]) {
    if (value === undefined) return
    if (new Set(value).size !== value.length || value.some(item => !known.has(item))) {
      throw new Error('Ready ToggleGroup: pressed values must identify distinct items.')
    }
    return [...value]
  }
  return {
    label, value: validate(props.value), defaultValue: validate(props.defaultValue),
    disabled: !!props.disabled || props.items.every(item => item.disabled),
  }
}
