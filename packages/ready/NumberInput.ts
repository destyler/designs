import { validateAccessibleText } from './accessible-text'

export type NumberInputProps = {
  label: string
  description?: string
  error?: string
  name?: string
  form?: string
  /** Decimal text; an empty string means no entered value. */
  value?: string
  defaultValue?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  onValueChange?: (value: string) => void
}

export const numberInputFormat = {
  locale: 'en-US',
  formatOptions: { useGrouping: false, maximumFractionDigits: 20 },
  pattern: '-?([0-9]+([.][0-9]*)?|[.][0-9]+)',
}

export function numberInputOptions({ label, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, step = 1 }: Pick<NumberInputProps, 'label' | 'min' | 'max' | 'step'>) {
  validateAccessibleText(label, 'NumberInput', 'label')
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
    throw new RangeError('Ready NumberInput: min and max must be finite, with min <= max.')
  if (!Number.isFinite(step) || step <= 0)
    throw new RangeError('Ready NumberInput: step must be positive and finite.')
  return { ...numberInputFormat, min, max, step }
}
