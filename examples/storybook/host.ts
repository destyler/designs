import type { Demo, Mount } from './demo-types'
import { getImplementationUrl, getUsageSource } from './usage-source'

export const frameworks = ['React', 'Vue', 'Solid', 'Svelte'] as const
export type Framework = (typeof frameworks)[number]
// Vite keeps one fresh module per native adapter; each adapter has its own
// TypeScript project so React JSX and Solid JSX are not mixed by the checker.
const loaders = import.meta.glob<{ mountDemo: Mount }>('./frameworks/{react,vue,solid,svelte}.{ts,tsx}')
const adapterFiles: Record<Framework, string> = {
  React: './frameworks/react.tsx',
  Vue: './frameworks/vue.ts',
  Solid: './frameworks/solid.tsx',
  Svelte: './frameworks/svelte.ts',
}

class ReadyStory extends HTMLElement {
  #activation = 0
  #dispose?: ReturnType<Mount>
  definition?: { name: string; framework: Framework; demo: Demo }

  connectedCallback() {
    if (!this.definition) return
    const { name, framework, demo } = this.definition
    const activation = ++this.#activation
    const target = document.createElement('div')
    this.dataset.readyStory = name
    this.dataset.framework = framework.toLowerCase()
    if (demo.wide) this.dataset.wide = ''
    this.dataset.status = 'loading'
    target.setAttribute('role', 'status')
    target.textContent = `Loading ${framework} ${name}…`
    this.replaceChildren(target)
    void Promise.resolve().then(() => {
      const load = loaders[adapterFiles[framework]]
      if (!load) throw new Error(`Ready Storybook: missing ${framework} adapter`)
      return load()
    }).then(({ mountDemo }) => {
      if (!this.isConnected || activation !== this.#activation) return
      target.removeAttribute('role')
      target.textContent = ''
      this.#dispose = mountDemo(target, name, demo)
      this.dataset.status = 'ready'
    }).catch((error: unknown) => {
      if (!this.isConnected || activation !== this.#activation) return
      this.dataset.status = 'error'
      target.setAttribute('role', 'alert')
      target.textContent = `Could not mount ${framework} ${name}.`
      console.error(error)
    })
  }

  disconnectedCallback() {
    // An old native import must not mount after a user switches stories.
    ++this.#activation
    const dispose = this.#dispose
    this.#dispose = undefined
    if (dispose) void dispose()
  }
}

const tag = 'destyler-ready-story'
if (!customElements.get(tag)) customElements.define(tag, ReadyStory)

export function nativeStory(name: string, framework: Framework, demo: Demo) {
  // The HTML renderer reuses the same node on a toolbar update, preserving
  // native state. Changing stories disconnects it; returning mounts afresh.
  let host: ReadyStory | undefined
  return {
    parameters: {
      docs: {
        source: {
          code: getUsageSource(name, framework, demo),
          type: 'code' as const,
          language: framework === 'React' || framework === 'Solid' ? 'tsx' : 'html',
        },
        description: {
          story: `[View implementation on GitHub](${getImplementationUrl(name, framework)}). [Install Ready](https://github.com/destyler/designs/blob/fadc289d06031827dba90bda2a1a4f20694e52f4/docs/ready-quickstart.md). [Download Shadcn CSS](./styles/shadcn-ready.css), import it after the Ready base stylesheet and set \`data-rd-theme="shadcn"\` on the document element.`,
        },
      },
    },
    render: () => {
      if (!host) {
        host = document.createElement(tag) as ReadyStory
        host.definition = { name, framework, demo }
      }
      return host
    },
  }
}
