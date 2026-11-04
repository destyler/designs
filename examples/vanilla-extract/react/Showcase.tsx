import { useEffect, useState } from 'react'
import { themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import { SwitchExample } from './SwitchExample'
import { DialogExample } from './DialogExample'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = useState(() => initialShowcaseState())
  useEffect(() => connectShowcase(setView), [])
  const theme = themes[view.theme]

  return <main className={`showcase-stage ${theme}`} data-framework="react" data-theme={view.theme}>
    {view.component === 'switch' ? <SwitchExample/> : <DialogExample colorMode={view.theme}/>}
  </main>
}
