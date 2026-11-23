<script setup lang="ts">
import { computed } from 'vue';
import { Collapsible as Primitive } from '@destyler-ui/vue';
import { validateAccessibleText } from '../accessible-text';

const props = withDefaults(defineProps<{ trigger: string; open?: boolean; defaultOpen?: boolean; disabled?: boolean }>(), {
  open: undefined, defaultOpen: undefined, disabled: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const text = computed(() => validateAccessibleText(props.trigger, 'Collapsible', 'trigger'));
function change({ open }: { open: boolean }) {
  emit('update:open', open);
  emit('openChange', open);
}
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :open="open" :default-open="defaultOpen" :disabled="disabled" @open-change="change">
      <Primitive.Trigger class="rd-button" :disabled="disabled">{{ text }}</Primitive.Trigger>
      <Primitive.Content><slot /></Primitive.Content>
    </Primitive.Root>
  </div>
</template>
