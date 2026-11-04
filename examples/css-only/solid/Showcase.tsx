import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import { SwitchExample } from './SwitchExample'
import { DialogExample } from './DialogExample'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = createSignal(initialShowcaseState())
  onMount(() => { onCleanup(connectShowcase(setView)) })

  return <main data-showcase data-framework="solid" data-theme={view().theme}>
    <Show when={view().component === 'switch'} fallback={<DialogExample/>}><SwitchExample/></Show>
  </main>
}
