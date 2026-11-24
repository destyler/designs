import type { TabsProps } from './Tabs.types'

export function validateTabs(label: string, items: TabsProps['items'], value?: string, defaultValue?: string) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('Ready Tabs: label must contain non-whitespace text.')
  const values = new Set<string>()
  for (const item of items) {
    if (typeof item.value !== 'string' || !item.value || /\s/.test(item.value)) {
      throw new Error('Ready Tabs: item values must be nonempty and contain no whitespace.')
    }
    if (values.has(item.value)) throw new Error('Ready Tabs: item values must be unique.')
    if (typeof item.label !== 'string' || !item.label.trim()) {
      throw new Error('Ready Tabs: item labels must contain non-whitespace text.')
    }
    values.add(item.value)
  }
  const initial = value ?? defaultValue
  if (initial !== undefined && !items.some(item => item.value === initial && !item.disabled)) {
    throw new Error('Ready Tabs: value or defaultValue must name an enabled item.')
  }
  return defaultValue ?? items.find(item => !item.disabled)?.value
}
