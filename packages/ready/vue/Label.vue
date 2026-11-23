<script setup lang="ts">
import { Label as Primitive } from '@destyler-ui/vue'
import type { LabelProps } from '../Label'

defineOptions({ inheritAttrs: false })
const props = defineProps<LabelProps>()
</script>

<template>
  <Primitive.Root class="rd-component" :for="props.for">
    <slot />
  </Primitive.Root>
</template>
