<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Collapse as Primitive } from '@destyler-ui/svelte/collapse'
  import { collapseItems, collapseValue } from '../Collapse'
  import type { CollapseItem, CollapseProps } from '../Collapse'

  let { items, value, defaultValue, multiple, collapsible, disabled, orientation = 'vertical',
    headingLevel = 3, onValueChange, panel }: CollapseProps & { panel?: Snippet<[CollapseItem]> } = $props()
  const known = $derived(collapseItems(items))
</script>

<div class="rd-component">
  <Primitive.Root value={collapseValue(known, multiple, value)}
    defaultValue={value === undefined ? collapseValue(known, multiple, defaultValue) : undefined}
    {multiple} {collapsible} {disabled} {orientation} onValueChange={event => onValueChange?.([...event.value])}>
    {#each items as item (item.value)}
      <Primitive.Item value={item.value} disabled={Boolean(disabled || item.disabled)}>
        <div class="rd-collapse-heading" role="heading" aria-level={headingLevel}>
          <Primitive.ItemTrigger>
            <span>{item.label}</span>
            <Primitive.ItemIndicator>⌄</Primitive.ItemIndicator>
          </Primitive.ItemTrigger>
        </div>
        <Primitive.ItemContent>{#if panel}{@render panel(item)}{:else}{item.content}{/if}</Primitive.ItemContent>
      </Primitive.Item>
    {/each}
  </Primitive.Root>
</div>
