export const items = [
  { id: 'one', label: 'First', content: 'First story' },
  { id: 'two', label: 'Second', content: 'Second story' },
  { id: 'three', label: 'Third', content: 'Third story' },
]

export function record(page: number) {
  const output = document.querySelector('[data-pages]')!
  output.textContent += String(page)
}
