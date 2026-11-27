import { createApp, h, type VNodeChild, type Component } from 'vue'
import * as components from '../../../packages/ready/vue'
import { componentFor, type Mount } from '../demo-types'

export const mountDemo: Mount = (target, name, { args, child, slots, action }) => {
  const Component = componentFor<Component>(components, name)
  const controller = action ? components.createToastController() : undefined
  const forId = name === 'Label' ? (args as { for: string }).for : undefined
  const app = createApp({
    render() {
      const provided: Record<string, () => VNodeChild> = Object.fromEntries(Object.entries(slots ?? {}).map(([key, value]) => [key, () => value]))
      if (child) provided.default = () => typeof child === 'string' ? child : h(components.Field, child.args)
      return [
        name === 'Separator' && h('p', 'Workspace details'),
        h(Component, { ...args, ...(controller ? { controller } : {}) }, provided),
        name === 'Separator' && h('p', 'Notification preferences'),
        forId && h('input', { id: forId, class: 'story-input' }),
        action && h('button', { type: 'button', class: 'rd-button story-action', onClick: () => controller?.show(action.message) }, action.label),
      ]
    },
  })
  app.config.idPrefix = 'ready-story'
  app.mount(target)
  return () => app.unmount()
}
