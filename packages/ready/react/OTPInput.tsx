import { useEffect, useId, useRef, useState } from 'react'
import { OtpInput as Primitive } from '@destyler-ui/react'
import { otpComplete, otpDigitCount, otpDigits, otpLabel, otpPaste, otpProposedDigits, syncOtpDigits, watchOtpReset } from '../OTPInput'
import type { OTPInputProps } from '../OTPInput'

export type { OTPInputProps } from '../OTPInput'

export function OTPInput({ label, length, name, value, defaultValue, required, disabled, mask, onValueChange }: OTPInputProps) {
  const count = otpDigitCount(length)
  const checkedLabel = otpLabel(label)
  const id = useId()
  const element = useRef<HTMLDivElement>(null)
  const [initial] = useState(() => otpDigits(count, defaultValue))
  const [local, setLocal] = useState(initial)
  const digits = otpDigits(count, value ?? local.slice(0, count))
  const latest = useRef({ value, digits, count })
  latest.current = { value, digits, count }
  useEffect(() => element.current ? watchOtpReset(element.current, () => {
    const state = latest.current
    const reset = state.value === undefined ? otpDigits(state.count, initial.slice(0, state.count)) : state.digits
    if (state.value === undefined) setLocal(reset)
    syncOtpDigits(element.current, reset)
  }) : undefined, [initial])
  const change = (next: string[]) => {
    if (disabled || next.every((digit, index) => digit === digits[index])) return
    if (value === undefined) setLocal(next)
    onValueChange?.([...next])
  }
  const complete = otpComplete(digits)
  return <div className="rd-component" ref={element}>
    <Primitive.Root value={digits} type="numeric" disabled={Boolean(disabled)} mask={mask}
      role="group" aria-labelledby={id} translations={{ inputLabel: (index, n) => `${checkedLabel} (${index + 1}/${n})` }}
      onValueChange={event => { const next = otpProposedDigits(count, event.value); if (next) change(next) }}>
      <span id={id} className="rd-otp-label">{checkedLabel}</span>
      <Primitive.Control>{digits.map((_, index) => <Primitive.Input key={index} index={index}
        required={required} pattern="[0-9]" autoComplete={index === 0 ? 'one-time-code' : 'off'}
        onPaste={event => {
          if (disabled) return
          const next = otpPaste(event.nativeEvent, digits, index)
          if (next) change(next)
        }} />)}</Primitive.Control>
      {name && <input type="hidden" name={name} value={!disabled && complete ? digits.join('') : ''} disabled={disabled || !complete} />}
    </Primitive.Root>
  </div>
}
