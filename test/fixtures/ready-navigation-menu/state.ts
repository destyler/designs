import type { NavigationMenuItem } from '../../../packages/ready/NavigationMenu'

export const items: readonly NavigationMenuItem[] = [
  { id: 'home', label: 'Home', href: '#home', current: true },
  { id: 'products', label: 'Products', links: [
    { id: 'desktop', label: 'Desktop', href: '#desktop' },
    { id: 'mobile', label: 'Mobile', href: '#mobile' },
  ] },
  { id: 'locked', label: 'Locked', disabled: true, links: [{ id: 'later', label: 'Later', href: '#later' }] },
  { id: 'docs', label: 'Docs', links: [{ id: 'guide', label: 'Guide', href: '#guide', current: true }] },
]

export function record(value: string | null) {
  const output = document.querySelector('[data-values]')!
  output.textContent += `${value ?? 'closed'}|`
}
