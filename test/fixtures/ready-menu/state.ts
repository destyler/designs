import type { MenuItem } from '../../../packages/ready/Menu'
export const items: readonly MenuItem[] = [
  { value: 'copy item', label: 'Copy' },
  { value: 'disabled', label: 'Locked', disabled: true },
  { value: 'archive/it', label: 'Archive' },
]
export function record(id: string, value: string | boolean) {
  document.querySelector('[data-results]')!.textContent += `${id}:${value}|`
}
