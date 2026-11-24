<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { Clipboard as Primitive } from '@destyler-ui/vue'
import { attachClipboard, clipboardStatus, clipboardText, type ClipboardPhase, type ClipboardProps } from '../Clipboard'

const props = defineProps<ClipboardProps>()
const root = ref<HTMLDivElement>()
let controller: ReturnType<typeof attachClipboard> | undefined
const id = useId()
const phase = ref<ClipboardPhase>('idle')
const state = computed(() => clipboardText(props))
onMounted(() => { if (root.value) controller = attachClipboard(root.value, next => { phase.value = next }) })
onUnmounted(() => controller?.dispose())
watch(() => props.value, () => controller?.invalidate(), { flush: 'sync' })
</script>

<template>
  <div ref="root" class="rd-component rd-clipboard">
    <Primitive.Root :ids="{ input: id }" :value="state.value">
      <Primitive.Label>{{ state.label }}</Primitive.Label>
      <Primitive.Control>
        <input :id="id" type="text" readonly :value="state.value" data-rd-copy-value="" />
        <button class="rd-button" type="button" data-rd-copy-button="" :disabled="state.value === ''" :aria-disabled="phase === 'pending' || undefined">{{ state.copyLabel }}</button>
      </Primitive.Control>
      <div role="status" aria-live="polite">{{ clipboardStatus(phase, state) }}</div>
    </Primitive.Root>
  </div>
</template>
