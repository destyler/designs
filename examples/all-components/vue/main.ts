import { createApp, nextTick } from 'vue'
import { examples } from './registry'
import { loadFamilyStyles } from '../shared/load-family-styles'

const params = new URLSearchParams(location.search)
const requested = params.get('component') || 'checkbox'
const family = Object.hasOwn(examples, requested) ? requested : 'checkbox'
void loadFamilyStyles(family).then(() => {
document.documentElement.dataset.theme = params.get('theme') === 'dark' ? 'dark' : 'light'
document.body.className = family + '-basic'
document.body.dataset.framework = 'vue'
document.body.dataset.component = family
let failed = false
const app = createApp(examples[family])
app.config.errorHandler = (error) => { failed = true; console.error(error) }
app.mount('#app')

void nextTick(() => {
  if (!failed && Object.hasOwn(examples, requested)) {
    parent.postMessage({ type: 'destyler:all-components-ready', framework: 'vue', family, theme: document.documentElement.dataset.theme }, location.origin)
  }
})

}).catch(error => console.error('Example stylesheet failed to load', error))
