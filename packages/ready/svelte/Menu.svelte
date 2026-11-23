<script lang="ts">
  import { Menu as Primitive } from '@destyler-ui/svelte/menu'
  import { allowMenuTab, emitMenuSelection, matchMenuClick, menuPosition, prepareMenu, preserveMenuOutsideFocus, type MenuProps } from '../Menu'

  let { trigger, items, onSelect, onOpenChange }: MenuProps = $props()
  const id = $props.id()
  const entries = $derived(prepareMenu(trigger, items, id))
</script>

<Primitive.Root positioning={menuPosition} closeOnSelect loopFocus
  onSelect={event => emitMenuSelection(entries, event.value, onSelect)}
  onOpenChange={event => onOpenChange?.(event.open)} onFocusOutside={preserveMenuOutsideFocus}>
  <Primitive.Context>
    {#snippet render(api)}
      <!-- svelte-ignore a11y_no_static_element_interactions (captures bubbled primitive menu events) -->
      <div class="rd-component rd-menu" onclickcapture={event => matchMenuClick(event, api())} onkeydowncapture={allowMenuTab}>
        <Primitive.Trigger disabled={entries.every(item => item.disabled)}>
          {trigger}<span aria-hidden="true">⌄</span>
        </Primitive.Trigger>
        <Primitive.Positioner>
          <Primitive.Content>
            {#each entries as item (item.id)}
              <Primitive.Item value={item.id} valueText={item.label} disabled={item.disabled}>{item.label}</Primitive.Item>
            {/each}
          </Primitive.Content>
        </Primitive.Positioner>
      </div>
    {/snippet}
  </Primitive.Context>
</Primitive.Root>
