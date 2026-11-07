<script setup lang="ts">
import { ref } from 'vue'
import { Radio } from '@destyler-ui/vue'

const value = ref('')
const items = ref([
  { label: 'React', value: 'react' },
  { label: 'Solid', value: 'solid' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte', disabled: true },
])
</script>

<template>
  <Radio.Root v-model="value">
    <Radio.Label>Framework</Radio.Label>
    <Radio.Item v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled">
      <Radio.ItemControl />
      <Radio.ItemText>{{ item.label }}</Radio.ItemText>
      <Radio.ItemHiddenInput />
    </Radio.Item>
  <p role="status" class="parity-status">{{ value || 'No selection' }}</p></Radio.Root>
</template>
