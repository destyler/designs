import { useEffect, useState } from 'react'
import { Switch } from '../../vendor/shadcn/new-york-v4/ui/switch'
import { Button } from '../../vendor/shadcn/new-york-v4/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from '../../vendor/shadcn/new-york-v4/ui/dialog'
import { connectShowcase, initialShowcaseState, type ShowcaseState } from '../vanilla-extract/shared/showcase'

/** The vendored shadcn sources are unchanged. Only this demo composition is ours. */
export default function ReferencePreview() {
  const [view, setView] = useState<ShowcaseState>({ component: 'switch', theme: 'light' })
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const previousDark = root.classList.contains('dark')
    const previousTheme = root.getAttribute('data-theme')
    const update = (state: ShowcaseState) => {
      // All Radix portals inherit the same document theme as the canvas.
      root.classList.toggle('dark', state.theme === 'dark')
      root.dataset.theme = state.theme
      setView(state)
    }
    update(initialShowcaseState())
    const disconnect = connectShowcase(update)
    return () => {
      disconnect()
      root.classList.toggle('dark', previousDark)
      if (previousTheme === null) root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', previousTheme)
    }
  }, [])
  return <main data-design="shadcn" data-theme={view.theme} className="reference-stage">
    {view.component === 'switch' ? <Switch aria-label="Airplane mode" checked={checked} onCheckedChange={setChecked}/> : <Dialog>
      <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
      <DialogContent data-demo-dialog="reference" data-portal-owner="reference">
        <DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>This is a dialog description.</DialogDescription></DialogHeader>
        <DialogFooter><DialogClose asChild><Button>Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>}
  </main>
}
