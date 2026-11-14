<script setup lang="ts">
import type { Option } from '../types'
import { ref, watchPostEffect } from 'vue'
import { useFieldContext, useSelectContext } from '@destyler-ui/vue'
const props=defineProps<{ value: string; options: Option[]; describedBy?: string }>()
const api = useSelectContext()
const field = useFieldContext()
const element=ref<HTMLSelectElement>()
// Track the primitive snapshot as well as effective value, then repair after DOM commit.
watchPostEffect(()=>{api.value;props.options;const value=props.value;const select=element.value;if(select?.isConnected){for(const option of select.options)option.selected=option.value===value;select.value=value}})
</script>
<template>
  <!-- Vue SSR does not translate a select's defaultValue into selected options.
       Keep the primitive's attributes, focus handling and sole native select. -->
  <select ref="element" :aria-describedby="describedBy ?? field?.ariaDescribedby" v-bind="api.getHiddenSelectProps()" :value="value">
    <option v-if="!value" value="" selected />
    <option v-for="item in options" :key="item.value"
      :value="item.value" :disabled="item.disabled"
      :selected="value === item.value">{{ item.label }}</option>
  </select>
</template>
