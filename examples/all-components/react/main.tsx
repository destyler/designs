import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { examples, type Family } from './registry'
import '../shared/theme.css'

const query = new URLSearchParams(window.location.search)
const requested = query.get('component') ?? 'checkbox'
const family: Family = Object.hasOwn(examples, requested) ? requested as Family : 'checkbox'
const theme = query.get('theme') === 'dark' ? 'dark' : 'light'
document.documentElement.dataset.theme = theme
document.body.className = `${family}-basic`
document.body.dataset.framework = 'react'
document.body.dataset.component = family
const Example = examples[family]
const root = document.getElementById('root')
if (!root) throw new Error('Example mount element is missing')
function App() {
  useEffect(() => {
    if (Object.hasOwn(examples, requested)) {
      window.parent.postMessage({ type: 'destyler:all-components-ready', framework: 'react', family, theme }, location.origin)
    }
  }, [])
  return <Example />
}
createRoot(root).render(<App />)
