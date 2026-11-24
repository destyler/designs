export interface TabsItem {
  /** Stable, unique, nonempty value without whitespace. */
  value: string
  label: string
  disabled?: boolean
  /** Plain-text fallback when no framework-specific panel renderer is supplied. */
  content?: string
}

export interface TabsProps {
  /** Accessible name of the tab list. */
  label: string
  items: readonly TabsItem[]
  value?: string
  /** Initial selection when uncontrolled. Defaults to the first enabled item. */
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  activationMode?: 'automatic' | 'manual'
  onValueChange?: (value: string) => void
}
