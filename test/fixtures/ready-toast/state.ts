import { createToastController } from '../../../packages/ready/Toast'

export const controller = createToastController()
export const unused = createToastController()
export const beforeMount = controller.show({ title: 'Before setup' })
export function expose(unmount: () => void) {
  Object.assign(window, { toastFixture: { controller, unused, beforeMount, unmount } })
}
