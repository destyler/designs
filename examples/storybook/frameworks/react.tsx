import { createElement, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import * as components from '../../../packages/ready/react'
import { componentFor, type Mount } from '../demo-types'

export const mountDemo: Mount = (target, name, { args, child, slots, action }) => {
  const Component = componentFor<ComponentType<Record<string, unknown>>>(components, name)
  const root = createRoot(target)
  const controller = action ? components.createToastController() : undefined
  const props: Record<string, unknown> = { ...args, ...slots, ...(controller ? { controller } : {}) }
  const forId = name === 'Label' ? (args as { for: string }).for : undefined
  if (forId) Object.assign(props, { for: undefined, htmlFor: forId })
  const content = typeof child === 'string' ? child : child ? createElement(components.Field, child.args) : undefined

  root.render(<>
    {name === 'Separator' && <p>Workspace details</p>}
    {createElement(Component, props, content)}
    {name === 'Separator' && <p>Notification preferences</p>}
    {forId && <input id={forId} className="story-input" />}
    {action && <button type="button" className="rd-button story-action" onClick={() => controller?.show(action.message)}>{action.label}</button>}
  </>)
  return () => root.unmount()
}
