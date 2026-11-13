<script module lang="ts">
  import type { SelectRootProps } from '@destyler-ui/svelte/select'

  type Framework = { label: string, value: string, disabled?: boolean }
  export interface BasicProps extends Omit<SelectRootProps<Framework>, 'collection'> {}
</script>

<script lang="ts">
  import { Select, createListCollection } from '@destyler-ui/svelte/select'

  const props: BasicProps = $props()
  let value = $state<string[]>([])
  const collection = createListCollection<Framework>({
    items: [
      { label: 'React', value: 'react' },
      { label: 'Solid', value: 'solid' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte', disabled: true },
    ],
  })
</script>

<Select.Root {collection} bind:value {...props}>
  <Select.Label>Framework</Select.Label>
  <Select.Control>
    <Select.Trigger>
      <Select.ValueText placeholder="Select a Framework" />
      <Select.Indicator><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg></Select.Indicator>
    </Select.Trigger>
  </Select.Control>
  <Select.Positioner data-testid="positioner">
    <Select.Content>
      <Select.ItemGroup>
        <Select.ItemGroupLabel>Frameworks</Select.ItemGroupLabel>
        {#each collection.items as item (item.value)}
          <Select.Item {item}>
            <Select.ItemText>{item.label}</Select.ItemText>
            <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        {/each}
      </Select.ItemGroup>
    </Select.Content>
  </Select.Positioner>
  <Select.HiddenSelect />
  <p role="status" class="parity-status">{value[0] || 'No selection'}</p>
</Select.Root>
