<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@destyler-ui/vue'
import {createListCollection} from '@destyler-ui/vue'

const value = ref<string[]>([])
const collection = createListCollection({
  items: [
    { label: 'React', value: 'react' },
    { label: 'Solid', value: 'solid' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte', disabled: true },
  ],
})
</script>

<template>
  <Select.Root :collection="collection" v-model="value">
    <Select.Label>Framework</Select.Label>
    <Select.Control>
      <Select.Trigger>
        <Select.ValueText placeholder="Select a Framework" />
        <Select.Indicator><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg></Select.Indicator>
      </Select.Trigger>
    </Select.Control>
    <Teleport to="body">
      <Select.Positioner data-testid="positioner">
        <Select.Content>
          <Select.ItemGroup>
            <Select.ItemGroupLabel>Frameworks</Select.ItemGroupLabel>
            <Select.Item v-for="item in collection.items" :key="item.value" :item="item">
              <Select.ItemText>{{ item.label }}</Select.ItemText>
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          </Select.ItemGroup>
        </Select.Content>
      </Select.Positioner>
    </Teleport>
    <Select.HiddenSelect />
    <p role="status" class="parity-status">{{ value[0] || 'No selection' }}</p>
  </Select.Root>
</template>
