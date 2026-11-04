// Pinned upstream components stay unchanged, including their Tailwind classes.
import { createRoot } from 'react-dom/client'
import { Switch } from '../../../vendor/shadcn/new-york-v4/ui/switch'
import { Button } from '../../../vendor/shadcn/new-york-v4/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '../../../vendor/shadcn/new-york-v4/ui/dialog'
import './styles.css'
import '../shared/fixture.css'

document.querySelector<HTMLSelectElement>('#theme')!.addEventListener('change', event => {
  document.documentElement.classList.toggle('dark', (event.target as HTMLSelectElement).value === 'dark')
})
function Reference() {
  return <>
    <div data-cases>
      <Switch data-case="updates" aria-label="Updates" defaultChecked />
      <Switch data-case="small" aria-label="Small" size="sm" />
      <Switch data-case="disabled" aria-label="Disabled" defaultChecked disabled />
    </div>
    <Dialog>
      <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogTitle>Dialog title</DialogTitle>
        <DialogDescription>This dialog uses only native anatomy and one CSS import.</DialogDescription>
        <DialogClose asChild><Button>Close</Button></DialogClose>
      </DialogContent>
    </Dialog>
  </>
}
createRoot(document.querySelector('#app')!).render(<Reference />)
