<script setup lang="ts">
import { useFieldContext, useSelectContext } from '@destyler-ui/vue'
defineProps<{ value: string; describedBy?: string }>()
const api = useSelectContext()
const field = useFieldContext()
</script>
<template>
  <!-- Vue SSR does not translate a select's defaultValue into selected options.
       Keep the primitive's attributes, focus handling and sole native select. -->
  <select :aria-describedby="describedBy ?? field?.ariaDescribedby" v-bind="api.getHiddenSelectProps()" :default-value="value">
    <option v-if="!value" value="" selected />
    <option v-for="item in api.collection.items" :key="item.value"
      :value="api.collection.getItemValue(item)" :disabled="api.collection.getItemDisabled(item)"
      :selected="value === item.value">{{ api.collection.stringifyItem(item) }}</option>
  </select>
</template>
