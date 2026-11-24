import { createMemo, createSignal, createUniqueId, Index, onCleanup, onMount, Show } from 'solid-js'
import { OtpInput as Primitive } from '@destyler-ui/solid/otp-input'
import { otpComplete, otpDigitCount, otpDigits, otpLabel, otpPaste, otpProposedDigits, syncOtpDigits, watchOtpReset } from '../OTPInput'
import type { OTPInputProps } from '../OTPInput'

export type { OTPInputProps } from '../OTPInput'

export function OTPInput(props: OTPInputProps) {
  const count = createMemo(() => otpDigitCount(props.length))
  const label = createMemo(() => otpLabel(props.label))
  const id = createUniqueId()
  let element: HTMLDivElement | undefined
  const initial = otpDigits(count(), props.defaultValue)
  const [local, setLocal] = createSignal(initial)
  const digits = createMemo(() => otpDigits(count(), props.value ?? local().slice(0, count())))
  const complete = createMemo(() => otpComplete(digits()))
  onMount(() => {
    if (element) onCleanup(watchOtpReset(element, () => {
      const reset = props.value === undefined ? otpDigits(count(), initial.slice(0, count())) : digits()
      if (props.value === undefined) setLocal(reset)
      syncOtpDigits(element, reset)
    }))
  })
  const change = (next: string[]) => {
    if (props.disabled || next.every((digit, index) => digit === digits()[index])) return
    if (props.value === undefined) setLocal(next)
    props.onValueChange?.([...next])
  }
  return <div class="rd-component" ref={node => { element = node }}>
    <Primitive.Root value={digits()} type="numeric" disabled={Boolean(props.disabled)} mask={props.mask}
      role="group" aria-labelledby={id} translations={{ inputLabel: (index, n) => `${label()} (${index + 1}/${n})` }}
      onValueChange={event => { const next = otpProposedDigits(count(), event.value); if (next) change(next) }}>
      <span id={id} class="rd-otp-label">{label()}</span>
      <Primitive.Control><Index each={digits()}>{(_, index) => <Primitive.Input index={index}
        required={props.required} pattern="[0-9]" autocomplete={index === 0 ? 'one-time-code' : 'off'}
        onPaste={event => {
          if (props.disabled) return
          const next = otpPaste(event, digits(), index)
          if (next) change(next)
        }} />}</Index></Primitive.Control>
      <Show when={props.name}><input type="hidden" name={props.name} value={!props.disabled && complete() ? digits().join('') : ''} disabled={props.disabled || !complete()} /></Show>
    </Primitive.Root>
  </div>
}
