<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Tooltip as Primitive } from '@destyler-ui/vue'
import { attachTooltipPolicy, tooltipPositioning, tooltipText, type TooltipProps } from '../Tooltip'

const props = defineProps<TooltipProps>()
const copy = computed(() => tooltipText(props))
const root = ref<HTMLDivElement>()
const open = ref(false)
let cleanup: (() => void) | undefined
onMounted(() => { if (root.value) cleanup = attachTooltipPolicy(root.value, value => { open.value = value }) })
onUnmounted(() => cleanup?.())
</script>

<template>
  <div ref="root" class="rd-component rd-tooltip">
    <Primitive.Root :open="open" interactive :close-on-escape="false" :close-on-click="false" :close-on-pointer-down="false" :close-on-scroll="false"
      :lazy-mount="false" :unmount-on-exit="false" :positioning="tooltipPositioning">
      <Primitive.Trigger type="button" class="rd-button">{{ copy.trigger }}</Primitive.Trigger>
      <Primitive.Positioner><Primitive.Content>{{ copy.text }}</Primitive.Content></Primitive.Positioner>
    </Primitive.Root>
  </div>
</template>
