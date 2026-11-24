<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId } from 'vue'
import { OtpInput as Primitive } from '@destyler-ui/vue'
import { otpComplete, otpDigitCount, otpDigits, otpLabel, otpPaste, otpProposedDigits, syncOtpDigits, watchOtpReset } from '../OTPInput'
import type { OTPInputProps } from '../OTPInput'

const props = defineProps<Omit<OTPInputProps, 'onValueChange'>>()
const emit = defineEmits<{ 'update:value': [digits: string[]]; valueChange: [digits: string[]] }>()
const count = computed(() => otpDigitCount(props.length))
const text = computed(() => otpLabel(props.label))
const id = useId()
const element = ref<HTMLDivElement>()
const initial = otpDigits(count.value, props.defaultValue)
const local = ref(initial)
const digits = computed(() => otpDigits(count.value, props.value ?? local.value.slice(0, count.value)))
const complete = computed(() => otpComplete(digits.value))
let cleanup: (() => void) | undefined
onMounted(() => {
  if (element.value) cleanup = watchOtpReset(element.value, () => {
    const reset = props.value === undefined ? otpDigits(count.value, initial.slice(0, count.value)) : digits.value
    if (props.value === undefined) local.value = reset
    syncOtpDigits(element.value, reset)
  })
})
onUnmounted(() => cleanup?.())
function change(next: string[]) {
  if (props.disabled || next.every((digit, index) => digit === digits.value[index])) return
  if (props.value === undefined) local.value = next
  emit('update:value', [...next])
  emit('valueChange', [...next])
}
function nativeChange(event: { value: string[] }) {
  const next = otpProposedDigits(count.value, event.value)
  if (next) change(next)
}
function paste(event: ClipboardEvent, index: number) {
  if (props.disabled) return
  const next = otpPaste(event, digits.value, index)
  if (next) change(next)
}
</script>

<template>
  <div ref="element" class="rd-component">
    <Primitive.Root :model-value="digits" type="numeric" :disabled="Boolean(disabled)" :mask="mask"
      role="group" :aria-labelledby="id" :translations="{ inputLabel: (index, n) => `${text} (${index + 1}/${n})` }"
      @value-change="nativeChange">
      <span :id="id" class="rd-otp-label">{{ text }}</span>
      <Primitive.Control>
        <Primitive.Input v-for="(_, index) in digits" :key="index" :index="index" :required="required"
          pattern="[0-9]" :autocomplete="index === 0 ? 'one-time-code' : 'off'" @paste="paste($event, index)" />
      </Primitive.Control>
      <input v-if="name" type="hidden" :name="name" :value="!disabled && complete ? digits.join('') : ''" :disabled="disabled || !complete" />
    </Primitive.Root>
  </div>
</template>
