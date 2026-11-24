/** @jsxImportSource solid-js */
import { createComponent, type Component } from 'solid-js'
import { render } from 'solid-js/web'
import * as components from '../../../packages/ready/solid'
import { componentFor, type Mount } from '../demo-types'

export const mountDemo: Mount = (target, name, { args, child, slots, action }) => {
  const DemoComponent = componentFor<Component>(components, name)
  const controller = action ? components.createToastController() : undefined
  const forId = name === 'Label' ? (args as { for: string }).for : undefined

  return render(() => <>
    {name === 'Separator' && <p>Workspace details</p>}
    {createComponent(DemoComponent, {
      ...args,
      ...slots,
      ...(controller ? { controller } : {}),
      get children() { return typeof child === 'string' ? child : child ? <components.Field {...child.args} /> : undefined },
    })}
    {name === 'Separator' && <p>Notification preferences</p>}
    {forId && <input id={forId} class="story-input" />}
    {action && <button type="button" class="rd-button story-action" onClick={() => controller?.show(action.message)}>{action.label}</button>}
  </>, target)
}
