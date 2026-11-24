<script setup lang="ts">
import { Splitter as Primitive } from '@destyler-ui/vue';
import { computed } from 'vue';
import { preventSplitterHover, resolveSplitter, splitterFirstSize, splitterPanels, type SplitterProps } from '../Splitter';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<SplitterProps, 'onSizeChange'>>();
const emit = defineEmits<{ sizeChange: [size: number] }>();
const layout = computed(() => resolveSplitter(props));
function notify({ size }: { size: { id: string | number; size?: number }[] }) {
  const first = splitterFirstSize(size);
  if (first !== undefined) emit('sizeChange', first);
}
</script>

<template>
  <div class="rd-splitter" @pointerover.capture="preventSplitterHover" :data-orientation="layout.orientation">
    <Primitive.Root :default-size="layout.defaultSize" :orientation="layout.orientation" @size-change="notify">
      <Primitive.Panel :id="splitterPanels.first"><slot name="first" /></Primitive.Panel>
      <Primitive.ResizeTrigger :id="splitterPanels.handle" :step="layout.step" :disabled="layout.disabled"
        type="button" :tabindex="layout.disabled ? -1 : 0" :aria-disabled="layout.disabled || undefined" :aria-label="layout.label" />
      <Primitive.Panel :id="splitterPanels.second"><slot name="second" /></Primitive.Panel>
    </Primitive.Root>
  </div>
</template>
