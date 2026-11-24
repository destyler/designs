<script setup lang="ts">
import { Toggle as Primitive } from '@destyler-ui/vue'
import { validateAccessibleText } from '../accessible-text'
import type { ToggleProps } from '../Toggle'

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<Omit<ToggleProps, 'onPressedChange'>>(), {
  pressed: undefined, defaultPressed: undefined, disabled: undefined,
})
const emit = defineEmits<{ 'update:pressed': [value: boolean]; pressedChange: [value: boolean] }>()
function change(pressed: boolean) {
  emit('update:pressed', pressed)
  emit('pressedChange', pressed)
}
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :model-value="pressed" :default-pressed="defaultPressed" :disabled="disabled" @pressed-change="change">
      {{ validateAccessibleText(label, 'Toggle', 'label') }}
    </Primitive.Root>
  </div>
</template>
