<script setup lang="ts">
import { Separator as Primitive } from '@destyler-ui/vue';
import type { SeparatorProps } from '../Separator';

defineOptions({ inheritAttrs: false });
const props = defineProps<SeparatorProps>();
</script>

<template>
  <Primitive.Root class="rd-component" :orientation="props.orientation ?? 'horizontal'" />
</template>
