import { useEffect, useState } from 'react'
import { Switch } from '../../vendor/shadcn/new-york-v4/ui/switch'
import { Button } from '../../vendor/shadcn/new-york-v4/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from '../../vendor/shadcn/new-york-v4/ui/dialog'
import { connectShowcase, initialShowcaseState, type ShowcaseState } from '../vanilla-extract/shared/showcase'

/** The vendored shadcn sources are unchanged. Only this demo composition is ours. */
export default function ReferencePreview() {
  const [view, setView] = useState<ShowcaseState>({ component: 'switch', theme: 'light' })
  const [checked, setChecked] = useState(false)
  useEffect(() => { setView(initialShowcaseState()); return connectShowcase(setView) }, [])
  return <main data-design="shadcn" data-theme={view.theme} className={`reference-stage ${view.theme === 'dark' ? 'dark' : ''}`}>
    {view.component === 'switch' ? <Switch aria-label="Airplane mode" checked={checked} onCheckedChange={setChecked}/> : <Dialog>
      <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
      <DialogContent data-design="shadcn" data-demo-dialog="reference" data-portal-owner="reference" className={view.theme === 'dark' ? 'dark' : ''} showCloseButton={false}>
        <DialogHeader><DialogTitle>Dialog title</DialogTitle><DialogDescription>This is a dialog description.</DialogDescription></DialogHeader>
        <DialogFooter><DialogClose asChild><Button>Close</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>}
  </main>
}
