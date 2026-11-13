// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Button } from '@/registry/new-york-v4/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/registry/new-york-v4/ui/dialog'

export default function Example() {
  return <Dialog><DialogTrigger asChild><Button variant="outline">Open Dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog Title</DialogTitle><DialogDescription>Dialog Description</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose></DialogFooter></DialogContent></Dialog>
}
