import { createMemo, For, onCleanup } from 'solid-js'
import { NavigationMenu as Primitive } from '@destyler-ui/solid/navigation-menu'
import { navigationEscape, navigationFocusOut, navigationLinkClick, navigationLinkKeys, navigationTriggerDirection, prepareNavigationMenu, type NavigationMenuProps } from '../NavigationMenu'

export function NavigationMenu(props: NavigationMenuProps) {
  const entries = createMemo(() => prepareNavigationMenu(props.label, props.items))
  return <Primitive.Root class="rd-component rd-navigation-menu" aria-label={props.label}
    disableHoverTrigger disablePointerLeaveClose onValueChange={event => props.onValueChange?.(event.value)}>
    <Primitive.Context>{api => <Primitive.List role="list"
      ref={element => {
        const keydown = (event: KeyboardEvent) => navigationTriggerDirection(event, api())
        element.addEventListener('keydown', keydown, true)
        onCleanup(() => element.removeEventListener('keydown', keydown, true))
      }} onKeyDown={event => navigationEscape(event, api())} onFocusOut={event => navigationFocusOut(event, api())}>
      <For each={entries()}>{item => <Primitive.Item value={item.id} role="listitem">
        {'href' in item ? <a href={item.href} aria-current={item.current ? 'page' : undefined}
          onClick={event => navigationLinkClick(event, api())} onKeyDown={navigationLinkKeys}>{item.label}</a>
          : <>
            <Primitive.Trigger value={item.id} disabled={item.disabled}>
              {item.label}<span aria-hidden="true">⌄</span>
            </Primitive.Trigger>
            <Primitive.Content value={item.id}>
              <ul class="rd-navigation-menu-panel-links" role="list">
                <For each={item.links}>{link => <li>
                  <a href={link.href} aria-current={link.current ? 'page' : undefined}
                    onClick={event => navigationLinkClick(event, api())} onKeyDown={navigationLinkKeys}>{link.label}</a>
                </li>}</For>
              </ul>
            </Primitive.Content>
          </>}
      </Primitive.Item>}</For>
    </Primitive.List>}</Primitive.Context>
  </Primitive.Root>
}
