import type { Demo } from './demo-types'
import type { Framework } from './host'
import { getImplementationUrl, getUsageSource } from './usage-source'

let sourceExpanded = false

const filenames: Record<Framework, string> = {
  React: 'Example.tsx',
  Vue: 'Example.vue',
  Solid: 'Example.tsx',
  Svelte: 'Example.svelte',
}

export function usagePanel(name: string, framework: Framework, demo: Demo) {
  const source = getUsageSource(name, framework, demo)
  const panel = document.createElement('details')
  panel.dataset.readySource = ''
  panel.open = sourceExpanded
  panel.addEventListener('toggle', () => {
    if (panel.isConnected) sourceExpanded = panel.open
  })
  const summary = document.createElement('summary')
  summary.textContent = 'Usage code'

  const help = document.createElement('p')
  help.className = 'story-source-note'
  help.textContent = `${framework} usage example · ${filenames[framework]}. This code imports Ready's base styles. For the appearance shown in Shadcn, download the compiled CSS, import it after the base styles, and set data-rd-theme=“shadcn” on the document element. No Tailwind installation needed for the compiled CSS.`

  const header = document.createElement('div')
  header.className = 'story-source-actions'
  const link = document.createElement('a')
  link.href = getImplementationUrl(name, framework)
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'View implementation on GitHub'

  const themeLink = document.createElement('a')
  themeLink.href = './styles/shadcn-ready.css'
  themeLink.download = 'shadcn-ready.css'
  themeLink.textContent = 'Download Shadcn CSS'

  const quickstart = document.createElement('a')
  quickstart.href = 'https://github.com/destyler/designs/blob/fadc289d06031827dba90bda2a1a4f20694e52f4/docs/ready-quickstart.md'
  quickstart.target = '_blank'
  quickstart.rel = 'noopener noreferrer'
  quickstart.textContent = 'Install Ready'

  const links = document.createElement('div')
  links.className = 'story-source-links'
  links.append(link, quickstart, themeLink)

  const copy = document.createElement('button')
  copy.type = 'button'
  copy.className = 'rd-button'
  copy.textContent = 'Copy code'
  const status = document.createElement('span')
  status.className = 'story-source-status'
  status.setAttribute('role', 'status')

  const pre = document.createElement('pre')
  pre.tabIndex = 0
  pre.setAttribute('aria-label', `${framework} example source code`)
  const code = document.createElement('code')
  // Examples are source text, never interactive markup in this pane.
  code.textContent = source
  pre.append(code)
  copy.addEventListener('click', async () => {
    copy.disabled = true
    status.textContent = ''
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(source)
      if (panel.isConnected) status.textContent = 'Code copied.'
    } catch {
      if (panel.isConnected) status.textContent = 'Could not copy automatically. Select and copy the code below.'
    } finally {
      copy.disabled = false
    }
  })

  header.append(links, copy)
  panel.append(summary, help, header, status, pre)
  return panel
}
