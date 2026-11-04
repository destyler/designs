import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import { SwitchExample } from './SwitchExample'
import { DialogExample } from './DialogExample'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = createSignal(initialShowcaseState())
  onMount(() => { onCleanup(connectShowcase(setView)) })
  const theme = () => themes[view().theme]

  return <main class={`showcase-stage ${theme()}`} data-framework="solid" data-theme={view().theme}>
    <Show when={view().component === 'switch'} fallback={<DialogExample colorMode={view().theme}/>}><SwitchExample/></Show>
  </main>
}
