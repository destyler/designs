import { mount, unmount } from 'svelte'
import Canvas from './SvelteCanvas.svelte'
import type { Mount } from '../demo-types'

export const mountDemo: Mount = (target, name, demo) => {
  const instance = mount(Canvas, { target, props: { name, demo } })
  return () => unmount(instance)
}
