import { validateAccessibleText } from './accessible-text'

export interface ComboboxOption {
  /** Unique nonempty option key. Empty string represents no selection. */
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  label: string
  options: readonly ComboboxOption[]
  value?: string
  defaultValue?: string
  disabled?: boolean
  description?: string
  placeholder?: string
  emptyMessage?: string
  onValueChange?: (value: string) => void
}

export const comboboxPosition = { sameWidth: true }
export const comboboxTranslations = { triggerLabel: 'Show options', clearTriggerLabel: 'Clear selection' }

export function comboboxOptions(options: readonly ComboboxOption[]) {
  const seen = new Set<string>()
  for (const item of options) {
    if (typeof item?.value !== 'string' || item.value === '' || seen.has(item.value))
      throw new Error('Ready Combobox: option values must be nonempty and unique.')
    seen.add(item.value)
    validateAccessibleText(item.label, 'Combobox', 'option label')
  }
  return options
}

export function filterCombobox(options: readonly ComboboxOption[], query: string | null) {
  const needle = query?.trim().toLowerCase()
  return needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : [...options]
}

export function selectedCombobox(options: readonly ComboboxOption[], value: string) {
  return options.find(option => option.value === value)
}

export function comboboxText(label: string, emptyMessage = 'No matching options') {
  return {
    label: validateAccessibleText(label, 'Combobox', 'label'),
    emptyMessage: validateAccessibleText(emptyMessage, 'Combobox', 'emptyMessage'),
  }
}
