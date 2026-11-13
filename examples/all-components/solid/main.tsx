import { onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { examples, type Family } from './registry'
import { loadFamilyStyles } from '../shared/load-family-styles'

const params = new URLSearchParams(window.location.search)
const requested = params.get('component') ?? 'checkbox'
const knownFamily = Object.hasOwn(examples, requested)
const family: Family = knownFamily ? requested as Family : 'checkbox'
const requestedTheme = params.get('theme')
const theme = requestedTheme === 'dark' ? 'dark' : 'light'
const validSelection = knownFamily && (requestedTheme === null || requestedTheme === 'light' || requestedTheme === 'dark')
void loadFamilyStyles(family).then(() => {
document.documentElement.dataset.theme = theme
document.body.className = `${family}-basic`
document.body.dataset.framework = 'solid'
document.body.dataset.component = family
const Example = examples[family]
const root = document.getElementById('root')
if (!root) throw new Error('The Solid example root is missing')
let mounted = false
function App() {
  onMount(() => {
    queueMicrotask(() => {
      if (mounted && validSelection && window.parent !== window) {
        window.parent.postMessage({ type: 'destyler:all-components-ready', framework: 'solid', family, theme }, window.location.origin)
      }
    })
  })
  return <Example />
}
render(() => <App />, root)
mounted = true

}).catch(error => console.error('Example stylesheet failed to load', error))
