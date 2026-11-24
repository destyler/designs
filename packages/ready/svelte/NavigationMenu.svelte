<script lang="ts">
  import { NavigationMenu as Primitive } from '@destyler-ui/svelte/navigation-menu'
  import { navigationEscape, navigationFocusOut, navigationLinkClick, navigationLinkKeys, navigationTriggerDirection, prepareNavigationMenu, type NavigationMenuProps } from '../NavigationMenu'

  let { label, items, onValueChange }: NavigationMenuProps = $props()
  const entries = $derived(prepareNavigationMenu(label, items))
</script>

<Primitive.Root class="rd-component rd-navigation-menu" aria-label={label} disableHoverTrigger disablePointerLeaveClose
  onValueChange={event => onValueChange?.(event.value)}>
  <Primitive.Context>
    {#snippet render(api)}
      <Primitive.List role="list" onkeydowncapture={event => navigationTriggerDirection(event, api())}
        onkeydown={event => navigationEscape(event, api())} onfocusout={event => navigationFocusOut(event, api())}>
        {#each entries as item (item.id)}
          <Primitive.Item value={item.id} role="listitem">
            {#if 'href' in item}
              <a href={item.href} aria-current={item.current ? 'page' : undefined}
                onclick={event => navigationLinkClick(event, api())} onkeydown={navigationLinkKeys}>{item.label}</a>
            {:else}
              <Primitive.Trigger value={item.id} disabled={item.disabled}>
                {item.label}<span aria-hidden="true">⌄</span>
              </Primitive.Trigger>
              <Primitive.Content value={item.id}>
                <ul class="rd-navigation-menu-panel-links" role="list">
                  {#each item.links as link (link.id)}
                    <li>
                      <a href={link.href} aria-current={link.current ? 'page' : undefined}
                        onclick={event => navigationLinkClick(event, api())} onkeydown={navigationLinkKeys}>{link.label}</a>
                    </li>
                  {/each}
                </ul>
              </Primitive.Content>
            {/if}
          </Primitive.Item>
        {/each}
      </Primitive.List>
    {/snippet}
  </Primitive.Context>
</Primitive.Root>
