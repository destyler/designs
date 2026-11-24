<script setup lang="ts">
import { computed } from 'vue'
import { ScrollArea as Primitive } from '@destyler-ui/vue'
import { scrollAreaOptions, type ScrollAreaProps } from '../ScrollArea'

const props = defineProps<ScrollAreaProps>()
const options = computed(() => scrollAreaOptions(props))
</script>

<template>
  <Primitive.Root class="rd-component rd-scroll-area">
    <Primitive.Viewport role="region" :aria-label="options.label" :style="options.style" :data-rd-orientation="options.orientation">
      <Primitive.Content><slot /></Primitive.Content>
    </Primitive.Viewport>
  </Primitive.Root>
</template>
