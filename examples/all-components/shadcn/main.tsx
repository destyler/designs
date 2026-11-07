import { createRoot } from 'react-dom/client'
import { Frame } from './Frame'
import { resolveFrameRequest } from './configuration'
import './reference.css'

const { family, theme, valid } = resolveFrameRequest(window.location.search)
document.documentElement.dataset.theme = theme
document.documentElement.classList.toggle('dark', theme === 'dark')
document.body.dataset.framework = 'shadcn'
document.body.dataset.component = family
const target = document.getElementById('root')
if (!target) throw new Error('Reference mount element is missing')
createRoot(target).render(<Frame family={family} theme={theme} valid={valid} />)
