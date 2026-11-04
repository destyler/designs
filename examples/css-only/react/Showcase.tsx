import { useEffect, useState } from 'react'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import { SwitchExample } from './SwitchExample'
import { DialogExample } from './DialogExample'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = useState(() => initialShowcaseState())
  useEffect(() => connectShowcase(setView), [])

  return <main data-showcase data-framework="react" data-theme={view.theme}>
    {view.component === 'switch' ? <SwitchExample/> : <DialogExample/>}
  </main>
}
