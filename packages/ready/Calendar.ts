import { validateAccessibleText } from './accessible-text'

export interface CalendarProps {
  label: string
  value?: string | null
  defaultValue?: string | null
  min?: string
  max?: string
  disabledDates?: readonly string[]
  locale?: string
  onValueChange?: (value: string) => void
}

type CalendarConstraints = Pick<CalendarProps, 'label' | 'min' | 'max' | 'disabledDates'>

export function calendarDate<T extends { toString(): string }>(parse: (date: string) => T, value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    throw new Error('Ready Calendar: dates must use YYYY-MM-DD (years 0001–9999).')
  }
  const date = parse(value)
  if (date.toString() !== value) throw new Error('Ready Calendar: invalid Gregorian date.')
  return date
}

export function calendarConstraints<T extends { toString(): string }>(parse: (date: string) => T, props: CalendarConstraints) {
  const label = validateAccessibleText(props.label, 'Calendar', 'label')
  const min = props.min === undefined ? undefined : calendarDate(parse, props.min)
  const max = props.max === undefined ? undefined : calendarDate(parse, props.max)
  if (props.min && props.max && props.min > props.max) throw new Error('Ready Calendar: min must not be after max.')
  const disabledDates = new Set(props.disabledDates?.map(date => calendarDate(parse, date).toString()))
  const blocks = (date: string) => disabledDates.has(date) || !!(props.min && date < props.min) || !!(props.max && date > props.max)
  return { label, min, max, disabledDates, blocks }
}

// The locked grid handles Enter using its focused date, but not a cell’s
// explicit disabled flag. Block that activation at capture before the table.
const triggerSelector = 'button[data-scope="calendar"][data-part="table-cell-trigger"]'

export function handleCalendarGridKey(event: Pick<KeyboardEvent, 'key' | 'target' | 'currentTarget' | 'preventDefault' | 'stopPropagation'>, focusBlocked: boolean) {
  if (!(event.target instanceof Element)) return
  const cell = event.target.closest<HTMLButtonElement>(triggerSelector)
  if (!cell) return
  if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') &&
    (focusBlocked || cell.getAttribute('aria-disabled') === 'true')) {
    event.preventDefault()
    event.stopPropagation()
  }
}
