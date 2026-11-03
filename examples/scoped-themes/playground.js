import { bindPortalTheme, themeTokens } from '../../src/portal-theme.js'

const configurations = [
  { id: 'neutral-light', skin: 'neutral', theme: 'light' },
  { id: 'ember-light', skin: 'ember', theme: 'light' },
  { id: 'neutral-dark', skin: 'neutral', theme: 'dark' },
  { id: 'ember-dark', skin: 'ember', theme: 'dark' },
]
const dialog = document.querySelector('#theme-dialog')
const cards = []
let activeCard = null
let binding = null
let opener = null

function name(card) {
  return `${card.root.dataset.skin === 'ember' ? 'Ember' : 'Neutral'} / ${card.root.dataset.theme}`
}

function update(card) {
  const { root, element } = card
  if (card.override) {
    root.style.setProperty('--ds-accent', root.dataset.theme === 'dark' ? '#9de3c0' : '#19734a')
    root.style.setProperty('--ds-on-accent', root.dataset.theme === 'dark' ? '#153c2b' : '#ffffff')
  } else {
    root.style.removeProperty('--ds-accent')
    root.style.removeProperty('--ds-on-accent')
  }
  element.querySelector('.card-title').textContent = name(card)
  element.querySelector('.mode-tag').textContent = card.override ? 'Local override' : 'Theme default'
  element.querySelector('[data-action="mode"]').textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode'
  element.querySelector('[data-action="mode"]').setAttribute('aria-label', `Switch card ${card.number} to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} mode`)
  element.querySelector('[data-action="skin"]').setAttribute('aria-label', `Switch skin for card ${card.number} to ${root.dataset.skin === 'neutral' ? 'Ember' : 'Neutral'}`)
  element.querySelector('[data-action="override"]').setAttribute('aria-pressed', String(card.override))
  element.querySelector('[data-action="override"]').setAttribute('aria-label', `Local accent for card ${card.number}`)
  const computed = getComputedStyle(root)
  const accent = computed.getPropertyValue('--ds-accent').trim()
  element.querySelector('.accent-value').textContent = accent
  element.querySelector('.token-swatch').style.backgroundColor = accent
  element.querySelector('.radius-value').textContent = computed.getPropertyValue('--ds-radius').trim()
  if (activeCard === card) {
    binding.sync()
    renderPortalTokens()
  }
}

function toggleMode(card) {
  card.root.dataset.theme = card.root.dataset.theme === 'dark' ? 'light' : 'dark'
  update(card)
}

function selectTab(card, tab) {
  if (tab.disabled) return
  for (const item of card.root.querySelectorAll('[role="tab"]')) {
    const selected = item === tab
    item.setAttribute('aria-selected', String(selected))
    item.tabIndex = selected ? 0 : -1
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected
  }
}

function reset(card) {
  card.root.dataset.skin = card.initial.skin
  card.root.dataset.theme = card.initial.theme
  card.override = false
  for (const input of card.root.querySelectorAll('input[type="checkbox"]')) input.checked = input.defaultChecked
  selectTab(card, card.root.querySelector('[role="tab"]'))
  update(card)
}

function renderPortalTokens() {
  const sourceStyle = getComputedStyle(activeCard.root)
  const portalStyle = getComputedStyle(dialog)
  const list = document.querySelector('#portal-tokens')
  list.replaceChildren()
  let matches = 0
  for (const token of themeTokens) {
    const source = sourceStyle.getPropertyValue(token).trim()
    const portal = portalStyle.getPropertyValue(token).trim()
    if (source === portal) matches++
    const term = document.createElement('dt')
    term.textContent = token
    const value = document.createElement('dd')
    value.textContent = `Source: ${source} · Portal: ${portal}`
    list.append(term, value)
  }
  document.querySelector('#portal-owner').textContent = `Card ${activeCard.number} · ${name(activeCard)}`
  document.querySelector('#portal-sync').textContent = `${matches} / ${themeTokens.length} tokens match`
}

function releasePortal() {
  binding?.dispose()
  binding = null
  activeCard = null
}

function openPortal(card, trigger) {
  if (dialog.open) return
  releasePortal()
  opener = trigger
  activeCard = card
  binding = bindPortalTheme(card.root, dialog)
  dialog.querySelector('input').checked = true
  dialog.querySelector('details').open = false
  renderPortalTokens()
  dialog.showModal()
}

for (const [index, initial] of configurations.entries()) {
  const element = document.querySelector('#card-template').content.firstElementChild.cloneNode(true)
  element.id = `card-${initial.id}`
  const root = element.querySelector('[data-theme-root]')
  root.id = `source-${initial.id}`
  const card = { element, root, initial, number: index + 1, override: false }
  cards.push(card)
  element.querySelector('.card-number').textContent = String(card.number).padStart(2, '0')
  element.querySelector('.card-title').id = `title-${initial.id}`
  element.setAttribute('aria-labelledby', `title-${initial.id}`)
  root.querySelector('[role="tablist"]').setAttribute('aria-label', `Card ${card.number} workspace settings`)
  for (const tab of root.querySelectorAll('[role="tab"]')) {
    const key = tab.dataset.tab
    tab.id = `${initial.id}-tab-${key}`
    tab.setAttribute('aria-controls', `${initial.id}-panel-${key}`)
    const panel = root.querySelector(`[data-panel="${key}"]`)
    panel.id = `${initial.id}-panel-${key}`
    panel.setAttribute('aria-labelledby', tab.id)
    tab.addEventListener('click', () => selectTab(card, tab))
    tab.addEventListener('keydown', event => {
      const enabled = [...root.querySelectorAll('[role="tab"]')].filter(item => !item.disabled)
      const current = enabled.indexOf(tab)
      const next = { ArrowRight: (current + 1) % enabled.length, ArrowLeft: (current + enabled.length - 1) % enabled.length, Home: 0, End: enabled.length - 1 }[event.key]
      if (next === undefined || event.altKey || event.ctrlKey || event.metaKey) return
      event.preventDefault()
      selectTab(card, enabled[next])
      enabled[next].focus()
    })
  }
  element.querySelector('[data-action="mode"]').addEventListener('click', () => toggleMode(card))
  element.querySelector('[data-action="skin"]').addEventListener('click', () => {
    root.dataset.skin = root.dataset.skin === 'neutral' ? 'ember' : 'neutral'
    update(card)
  })
  element.querySelector('[data-action="override"]').addEventListener('click', () => { card.override = !card.override; update(card) })
  element.querySelector('[data-action="reset"]').addEventListener('click', () => reset(card))
  element.querySelector('[data-action="open"]').addEventListener('click', event => openPortal(card, event.currentTarget))
  document.querySelector('#cards').append(element)
  reset(card)
}

dialog.querySelector('[data-action="mode"]').addEventListener('click', () => { if (activeCard) toggleMode(activeCard) })
dialog.querySelector('[data-action="override"]').addEventListener('click', () => {
  if (!activeCard) return
  activeCard.override = !activeCard.override
  update(activeCard)
})
dialog.querySelector('[data-action="close"]').addEventListener('click', () => dialog.close())
dialog.addEventListener('close', () => {
  // A queued close event must not tear down a newly reopened dialog.
  if (dialog.open) return
  releasePortal()
  if (opener?.isConnected) opener.focus()
  opener = null
})
document.querySelector('#reset-all').addEventListener('click', () => {
  for (const card of cards) reset(card)
  document.querySelector('#announcement').textContent = 'All four cards restored to their starting state.'
})

const missing = []
if (!('CSSScopeRule' in window)) missing.push('CSS @scope')
if (typeof dialog.showModal !== 'function') missing.push('native modal dialogs')
if (missing.length) {
  const notice = document.querySelector('#compatibility')
  notice.hidden = false
  notice.textContent = `This browser does not expose ${missing.join(' or ')}. The example may not render or behave correctly; use a browser with these features before comparing themes.`
  if (typeof dialog.showModal !== 'function') {
    for (const button of document.querySelectorAll('[data-action="open"]')) button.disabled = true
  }
}
document.documentElement.dataset.playgroundReady = 'true'
