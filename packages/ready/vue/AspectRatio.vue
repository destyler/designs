<script setup lang="ts">
import { AspectRatio as Primitive } from '@destyler-ui/vue';
import { type AspectRatioProps, validateAspectRatio } from '../AspectRatio';

defineOptions({ inheritAttrs: false });
const props = defineProps<AspectRatioProps>();
</script>

<template>
  <Primitive.Root :ratio="validateAspectRatio(props.ratio)">
    <Primitive.Content><slot /></Primitive.Content>
  </Primitive.Root>
</template>
