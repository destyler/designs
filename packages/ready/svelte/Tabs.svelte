<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Tabs as Primitive } from '@destyler-ui/svelte/tabs'
  import { validateTabs } from '../Tabs.model'
  import type { TabsItem, TabsProps } from '../Tabs.types'

  let { label, items, value, defaultValue, orientation = 'horizontal', activationMode = 'automatic',
    onValueChange, panel }: TabsProps & { panel?: Snippet<[TabsItem]> } = $props()
  const initial = $derived(validateTabs(label, items, value, defaultValue))
</script>

<div class="rd-component">
  <Primitive.Root {value} defaultValue={initial} {orientation} {activationMode} loopFocus composite
    onValueChange={event => { if (event.value !== null) onValueChange?.(event.value) }}>
    <Primitive.List aria-label={label}>
      {#each items as item (item.value)}
        <Primitive.Trigger value={item.value} disabled={item.disabled}>{item.label}</Primitive.Trigger>
      {/each}
    </Primitive.List>
    {#each items as item (item.value)}
      <Primitive.Content value={item.value}>
        {#if panel}{@render panel(item)}{:else}{item.content}{/if}
      </Primitive.Content>
    {/each}
  </Primitive.Root>
</div>
