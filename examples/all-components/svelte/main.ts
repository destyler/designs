import { mount, tick } from 'svelte'
import App from './App.svelte'
import { examples, type Family } from './registry'
import { loadFamilyStyles } from '../shared/load-family-styles'
const params = new URLSearchParams(location.search)
const requested = params.get('component') ?? 'checkbox'
const family: Family = Object.hasOwn(examples, requested) ? requested as Family : 'checkbox'
const requestedTheme = params.get('theme')
const theme = requestedTheme === 'dark' ? 'dark' : 'light'
const validSelection = Object.hasOwn(examples, requested) && (requestedTheme === null || requestedTheme === 'dark' || requestedTheme === 'light')
void loadFamilyStyles(family).then(() => {
document.documentElement.dataset.theme = theme
document.body.className = `${family}-basic`
document.body.dataset.framework = 'svelte'
document.body.dataset.component = family
const target = document.getElementById('app')
if (!target) throw new Error('The Svelte example root is missing')
mount(App, { target, props: { family } })

// Flush component effects before acknowledging a valid host selection.
void tick().then(() => {
  if (validSelection && window.parent !== window) {
    window.parent.postMessage({ type: 'destyler:all-components-ready', framework: 'svelte', family, theme }, location.origin)
  }
})

}).catch(error => console.error('Example stylesheet failed to load', error))
