<script setup lang="ts">
import { computed } from 'vue';
import { Avatar as Primitive } from '@destyler-ui/vue';
import { resolveAvatar } from '../Avatar';

const props = defineProps<{ alt: string; src?: string; fallback?: string }>();
const resolved = computed(() => resolveAvatar(props));
</script>

<template>
  <Primitive.Root :key="resolved.source ?? ''" class="rd-component rd-avatar" :role="resolved.label ? 'img' : undefined" :aria-label="resolved.label" :aria-hidden="resolved.label ? undefined : true">
    <Primitive.Image v-if="resolved.source" :src="resolved.source" alt="" aria-hidden="true" />
    <Primitive.Fallback aria-hidden="true">{{ resolved.text }}</Primitive.Fallback>
  </Primitive.Root>
</template>
