<script setup lang="ts">
import { useId } from 'vue'
import { Fieldset as Primitive } from '@destyler-ui/vue'
import { validateAccessibleText } from '../accessible-text'
import type { FieldsetProps } from '../Fieldset'

withDefaults(defineProps<FieldsetProps>(), { disabled: undefined })
const descriptionId = useId()
</script>

<template>
  <Primitive.Root class="rd-component" :disabled="disabled" :aria-describedby="description?.trim() ? descriptionId : undefined">
    <Primitive.Legend>{{ validateAccessibleText(legend, 'Fieldset', 'legend') }}</Primitive.Legend>
    <p v-if="description?.trim()" :id="descriptionId" class="rd-description">{{ description }}</p>
    <slot />
  </Primitive.Root>
</template>
