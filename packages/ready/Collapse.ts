export interface CollapseItem {
  /** Stable, unique, nonempty value without whitespace. */
  value: string
  label: string
  disabled?: boolean
  content?: string
}

export interface CollapseProps {
  items: readonly CollapseItem[]
  value?: readonly string[]
  defaultValue?: readonly string[]
  multiple?: boolean
  /** Allow closing the current item in single-open mode. */
  collapsible?: boolean
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
  headingLevel?: 2 | 3 | 4 | 5 | 6
  onValueChange?: (value: string[]) => void
}

export function collapseItems(items: readonly CollapseItem[]) {
  const values = new Set<string>()
  for (const item of items) {
    if (typeof item.value !== 'string' || !item.value || /\s/.test(item.value) || values.has(item.value)) {
      throw new Error('Ready Collapse: item values must be unique, nonempty and contain no whitespace.')
    }
    if (typeof item.label !== 'string' || !item.label.trim()) {
      throw new Error('Ready Collapse: item labels must contain non-whitespace text.')
    }
    values.add(item.value)
  }
  return values
}

export function collapseValue(
  known: ReadonlySet<string>, multiple?: boolean, requested?: readonly string[],
): string[] | undefined {
  if (requested === undefined) return
  if (!multiple && requested.length > 1) {
    throw new Error('Ready Collapse: single-open mode accepts at most one expanded item.')
  }
  if (new Set(requested).size !== requested.length || requested.some(value => !known.has(value))) {
    throw new Error('Ready Collapse: the expanded values must name distinct items.')
  }
  return [...requested]
}
