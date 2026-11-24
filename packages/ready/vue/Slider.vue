<script setup lang="ts">
import { computed } from 'vue';
import { Slider as Primitive } from '@destyler-ui/vue';
import { resolveSlider, type SliderProps } from '../Slider';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<SliderProps, 'onValueChange'>>();
const emit = defineEmits<{ 'update:value': [value: number]; valueChange: [value: number] }>();
const resolved = computed(() => resolveSlider(props));

function onChange(event: { value: number[] }) {
  emit('update:value', event.value[0]);
  emit('valueChange', event.value[0]);
}
</script>

<template>
  <Primitive.Root class="rd-component rd-slider" :min="resolved.min" :max="resolved.max" :step="resolved.step"
    :model-value="resolved.value" :default-value="resolved.defaultValue" :name="name" :disabled="disabled"
    thumb-alignment="center" @value-change="onChange">
    <Primitive.Label>{{ resolved.label }}</Primitive.Label>
    <div class="rd-slider-control-wrap"><Primitive.Control>
      <Primitive.Track><Primitive.Range /></Primitive.Track>
      <Primitive.Thumb :index="0"><Primitive.HiddenInput :disabled="disabled" /></Primitive.Thumb>
    </Primitive.Control></div>
  </Primitive.Root>
</template>
