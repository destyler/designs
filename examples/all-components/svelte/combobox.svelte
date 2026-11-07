<script module lang="ts">
  import type { ComboboxOpenChangeDetails, ComboboxValueChangeDetails } from '@destyler-ui/svelte/combobox'

  export interface BasicProps {
    disabled?: boolean
    multiple?: boolean
    onValueChange?: (details: ComboboxValueChangeDetails) => void
    onOpenChange?: (details: ComboboxOpenChangeDetails) => void
    readOnly?: boolean
    lazyMount?: boolean
    unmountOnExit?: boolean
  }
</script>

<script lang="ts">
  import { Combobox, createListCollection } from '@destyler-ui/svelte/combobox'

  const collection = createListCollection({
    items: [
      { label: 'React', value: 'react' },
      { label: 'Solid', value: 'solid' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte', disabled: true },
    ],
  })

  let { onOpenChange, onValueChange, ...props }: BasicProps = $props()
  let value = $state<string[]>([])
</script>

<Combobox.Root {collection} bind:value {onOpenChange} {onValueChange} {...props}>
  <Combobox.Label>Framework</Combobox.Label>
  <Combobox.Control>
    <Combobox.Input data-testid="input" placeholder="Select a framework" />
    <Combobox.Trigger data-testid="trigger" aria-label="Open framework options"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg></Combobox.Trigger>
    <Combobox.ClearTrigger disabled={!value.length}>Clear</Combobox.ClearTrigger>
  </Combobox.Control>
  <Combobox.Positioner data-testid="positioner">
    <Combobox.Content>
      <Combobox.ItemGroup>
            <Combobox.ItemGroupLabel class="parity-sr-only">Frameworks</Combobox.ItemGroupLabel>

        {#each collection.items as item (item.value)}
          <Combobox.Item {item}>
            <Combobox.ItemText>{item.label}</Combobox.ItemText>
            <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
          </Combobox.Item>
        {/each}
      </Combobox.ItemGroup>

    </Combobox.Content>
  </Combobox.Positioner>
<p role="status" class="parity-status">{collection.items.find(item => item.value === value[0])?.label || 'No selection'}</p></Combobox.Root>
