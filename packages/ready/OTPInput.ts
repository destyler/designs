/** Numeric OTP with positional digit values. Keep length stable during entry. */
export interface OTPInputProps {
  label: string
  length?: number
  name?: string
  value?: readonly string[]
  defaultValue?: readonly string[]
  required?: boolean
  disabled?: boolean
  /** Visual masking only: accepted digits are still available to page scripts and the form. */
  mask?: boolean
  onValueChange?: (digits: string[]) => void
}

export function otpDigitCount(length = 6) {
  if (!Number.isInteger(length) || length < 1 || length > 12) {
    throw new Error('Ready OTPInput: length must be an integer from 1 to 12.')
  }
  return length
}

export function otpLabel(label: string) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('Ready OTPInput: label must contain non-whitespace text.')
  return label
}

function validOtpDigits(length: number, values: readonly (string | undefined)[]) {
  return values.length <= length && values.every(value => value === undefined || (typeof value === 'string' && /^[0-9]?$/.test(value)))
}

export function otpDigits(length: number, values?: readonly (string | undefined)[]) {
  if (values && !validOtpDigits(length, values)) {
    throw new Error('Ready OTPInput: value must contain only single ASCII digits or blanks, up to length.')
  }
  return Array.from({ length }, (_, index) => values?.[index] ?? '')
}

export function otpProposedDigits(length: number, values: readonly string[]) {
  if (validOtpDigits(length, values)) return otpDigits(length, values)
}

export function otpPaste(event: ClipboardEvent, digits: string[], index: number) {
  if (event.defaultPrevented) return
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain').trim()
  if (!text || !/^[0-9]+$/.test(text)) return
  const next = [...digits]
  for (let i = 0; i < text.length && index + i < next.length; i++) next[index + i] = text[i]
  return next
}

export function otpComplete(digits: readonly string[]) {
  return digits.every(digit => digit !== '')
}

export function syncOtpDigits(container: HTMLElement | undefined | null, digits: readonly string[]) {
  container?.querySelectorAll<HTMLInputElement>('[data-scope="otp-input"][data-part="input"]').forEach((input, index) => {
    const digit = digits[index] ?? ''
    if (input.value !== digit) input.value = digit
  })
}

export function watchOtpReset(container: HTMLElement, restore: () => void) {
  const form = container.closest('form')
  let active = true
  const reset = (event: Event) => queueMicrotask(() => {
    if (active && !event.defaultPrevented) restore()
  })
  form?.addEventListener('reset', reset)
  return () => {
    active = false
    form?.removeEventListener('reset', reset)
  }
}
