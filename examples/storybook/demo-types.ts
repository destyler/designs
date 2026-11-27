import type { ToastMessage } from '../../packages/ready/Toast'

export type Demo = {
  args: object
  child?: string | { component: 'Field'; args: { label: string; name: string; type: 'email' } }
  slots?: Record<string, string>
  action?: { label: string; message: ToastMessage }
  wide?: boolean
}

export type Mount = (target: HTMLElement, name: string, definition: Demo) => () => void | Promise<void>

// A missing public export should fail visibly, rather than falling back to
// another component or silently shipping an empty framework story.
export function componentFor<T>(components: object, name: string): T {
  const component = (components as Record<string, T>)[name]
  if (!component) throw new Error(`Ready Storybook: missing public export ${name}`)
  return component
}
