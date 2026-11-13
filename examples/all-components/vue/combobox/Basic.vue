<script setup lang="ts">
import { ref } from 'vue'
import { createListCollection } from '@destyler-ui/vue'
import { Combobox } from '@destyler-ui/vue'

const frameworks = createListCollection({
  items: [
    { label: 'React', value: 'react' },
    { label: 'Solid', value: 'solid' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte', disabled: true },
  ],
})
const testProps = ref<string[]>([])
</script>

<template>
  <Combobox.Root :collection="frameworks" v-model="testProps">
    <Combobox.Label>Framework</Combobox.Label>
    <Combobox.Control>
      <Combobox.Input data-testid="input" placeholder="Select a framework" />
      <Combobox.Trigger data-testid="trigger" aria-label="Open framework options"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg></Combobox.Trigger>
      <Combobox.ClearTrigger :disabled="!testProps.length">Clear</Combobox.ClearTrigger>
    </Combobox.Control>
    <Teleport to="body">
      <Combobox.Positioner data-testid="positioner">
        <Combobox.Content>
          <Combobox.ItemGroup>
            <Combobox.ItemGroupLabel class="parity-sr-only">Frameworks</Combobox.ItemGroupLabel>

            <Combobox.Item v-for="item in frameworks.items" :key="item.value" :item="item">
              <Combobox.ItemText>{{ item.label }}</Combobox.ItemText>
              <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
            </Combobox.Item>
          </Combobox.ItemGroup>

        </Combobox.Content>
      </Combobox.Positioner>
    </Teleport>
  <p role="status" class="parity-status">{{ frameworks.items.find(item => item.value === testProps[0])?.label || 'No selection' }}</p></Combobox.Root>
</template>
