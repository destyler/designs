<script lang="ts">
  import { onMount } from 'svelte'
  import { OtpInput as Primitive } from '@destyler-ui/svelte/otp-input'
  import { otpComplete, otpDigitCount, otpDigits, otpLabel, otpPaste, otpProposedDigits, syncOtpDigits, watchOtpReset } from '../OTPInput'
  import type { OTPInputProps } from '../OTPInput'

  let { label, length, name, value, defaultValue, required, disabled, mask, onValueChange }: OTPInputProps = $props()
  const count = $derived(otpDigitCount(length))
  const text = $derived(otpLabel(label))
  const id = $props.id()
  let element: HTMLDivElement
  function initialDigits() { return otpDigits(otpDigitCount(length), defaultValue) }
  const initial = initialDigits()
  let local = $state(initial)
  const digits = $derived(otpDigits(count, value ?? local.slice(0, count)))
  const complete = $derived(otpComplete(digits))
  onMount(() => watchOtpReset(element, () => {
    const reset = value === undefined ? otpDigits(count, initial.slice(0, count)) : digits
    if (value === undefined) local = reset
    syncOtpDigits(element, reset)
  }))
  function change(next: string[]) {
    if (disabled || next.every((digit, index) => digit === digits[index])) return
    if (value === undefined) local = next
    onValueChange?.([...next])
  }
  function paste(event: ClipboardEvent, index: number) {
    if (disabled) return
    const next = otpPaste(event, digits, index)
    if (next) change(next)
  }
</script>

<div bind:this={element} class="rd-component">
  <Primitive.Root value={digits} type="numeric" disabled={Boolean(disabled)} {mask} role="group" aria-labelledby={id}
    translations={{ inputLabel: (index, n) => `${text} (${index + 1}/${n})` }}
    onValueChange={event => { const next = otpProposedDigits(count, event.value); if (next) change(next) }}>
    <span id={id} class="rd-otp-label">{text}</span>
    <Primitive.Control>
      {#each digits as _, index (index)}
        <Primitive.Input {index} {required} pattern="[0-9]" autocomplete={index === 0 ? 'one-time-code' : 'off'}
          onpaste={event => paste(event, index)} />
      {/each}
    </Primitive.Control>
    {#if name}<input type="hidden" {name} value={!disabled && complete ? digits.join('') : ''} disabled={disabled || !complete} />{/if}
  </Primitive.Root>
</div>
