import { bindPortalTheme } from './portal-theme.js'

for (const root of document.querySelectorAll('[data-demo-root]')) {
  const portal = document.getElementById(root.dataset.portal)
  const binding = bindPortalTheme(root, portal)
  function toggleTheme() {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
    binding.sync()
  }
  root.querySelector('[data-action="mode"]').addEventListener('click', toggleTheme)
  portal.querySelector('[data-action="mode"]').addEventListener('click', toggleTheme)
  root.querySelector('[data-action="open"]').addEventListener('click', () => {
    binding.sync()
    if (!portal.open) portal.showModal()
  })
  portal.querySelector('[data-action="close"]').addEventListener('click', () => portal.close())
  const tabs = [...root.querySelectorAll('[role="tab"]')]
  function select(tab) {
    for (const item of tabs) {
      const selected = item === tab
      item.setAttribute('aria-selected', String(selected))
      item.tabIndex = selected ? 0 : -1
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected
    }
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab))
    tab.addEventListener('keydown', event => {
      const enabled = tabs.filter(item => !item.disabled)
      const index = enabled.indexOf(tab)
      const next = { ArrowRight: (index + 1) % enabled.length, ArrowLeft: (index + enabled.length - 1) % enabled.length, Home: 0, End: enabled.length - 1 }[event.key]
      if (next === undefined) return
      event.preventDefault()
      select(enabled[next])
      enabled[next].focus()
    })
  }
}
