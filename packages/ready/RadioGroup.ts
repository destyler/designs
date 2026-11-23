import { validateAccessibleText } from './accessible-text'

export interface RadioGroupItem {
  /** Stable, unique, nonempty value without whitespace. */
  value: string
  label: string
  disabled?: boolean
}

export interface RadioGroupProps {
  label: string
  items: readonly RadioGroupItem[]
  /** Controlled selection. Use null for no selection. */
  value?: string | null
  /** Initial selection (and reset baseline) when uncontrolled. */
  defaultValue?: string | null
  /** Native radio name. If omitted, Destyler generates an isolated group name. */
  name?: string
  disabled?: boolean
  required?: boolean
  orientation?: 'horizontal' | 'vertical'
  onValueChange?: (value: string) => void
}

export function validateRadioGroup(label: string, items: readonly RadioGroupItem[]) {
  validateAccessibleText(label, 'RadioGroup', 'label')
  const seen = new Set<string>()
  for (const item of items) {
    if (typeof item.value !== 'string' || !item.value || /\s/.test(item.value)) {
      throw new Error('Ready RadioGroup: item values must be nonempty and contain no whitespace.')
    }
    if (seen.has(item.value)) throw new Error('Ready RadioGroup: item values must be unique.')
    seen.add(item.value)
    validateAccessibleText(item.label, 'RadioGroup', 'item labels')
  }
  return items
}

/** Keep item/input/control/label namespaces disjoint even for values like "input:daily". */
export function radioItemIds(id: string) {
  const prefix = `rd-radio:${id}`
  return {
    item: (value: string) => `${prefix}:item:${value}`,
    itemLabel: (value: string) => `${prefix}:label:${value}`,
    itemControl: (value: string) => `${prefix}:control:${value}`,
    itemHiddenInput: (value: string) => `${prefix}:input:${value}`,
  }
}
