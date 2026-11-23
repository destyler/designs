import { NavigationMenu as Primitive } from '@destyler-ui/react'
import { navigationEscape, navigationFocusOut, navigationLinkClick, navigationLinkKeys, navigationTriggerDirection, prepareNavigationMenu, type NavigationMenuProps } from '../NavigationMenu'

export function NavigationMenu({ label, items, onValueChange }: NavigationMenuProps) {
  const entries = prepareNavigationMenu(label, items)
  return <Primitive.Root className="rd-component rd-navigation-menu" aria-label={label}
    disableHoverTrigger disablePointerLeaveClose onValueChange={event => onValueChange?.(event.value)}>
    <Primitive.Context>{api => <Primitive.List role="list"
      onKeyDownCapture={event => navigationTriggerDirection(event, api)}
      onKeyDown={event => navigationEscape(event, api)} onBlur={event => navigationFocusOut(event, api)}>
      {entries.map(item => <Primitive.Item key={item.id} value={item.id} role="listitem">
        {'href' in item ? <a href={item.href} aria-current={item.current ? 'page' : undefined}
          onClick={event => navigationLinkClick(event, api)} onKeyDown={navigationLinkKeys}>{item.label}</a>
          : <>
            <Primitive.Trigger value={item.id} disabled={item.disabled}>
              {item.label}<span aria-hidden="true">⌄</span>
            </Primitive.Trigger>
            <Primitive.Content value={item.id}>
              <ul className="rd-navigation-menu-panel-links" role="list">
                {item.links.map(link => <li key={link.id}>
                  <a href={link.href} aria-current={link.current ? 'page' : undefined}
                    onClick={event => navigationLinkClick(event, api)} onKeyDown={navigationLinkKeys}>{link.label}</a>
                </li>)}
              </ul>
            </Primitive.Content>
          </>}
      </Primitive.Item>)}
    </Primitive.List>}</Primitive.Context>
  </Primitive.Root>
}
