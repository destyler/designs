<script setup lang="ts">
import { computed, useId } from 'vue';
import { Progress as Primitive } from '@destyler-ui/vue';
import { resolveProgress } from '../Progress';

const props = defineProps<{ label: string; value: number | null; min?: number; max?: number }>();
const labelId = useId();
const resolved = computed(() => resolveProgress(props));
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :model-value="resolved.value" :min="resolved.min" :max="resolved.max">
      <span :id="labelId" class="rd-progress-label">{{ resolved.label }}</span>
      <Primitive.Track :aria-labelledby="labelId">
        <Primitive.Range />
      </Primitive.Track>
    </Primitive.Root>
  </div>
</template>
