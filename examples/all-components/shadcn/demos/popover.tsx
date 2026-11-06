// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover'

export default function Example() {
  const [open, setOpen] = useState(false)
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline">click me</Button></PopoverTrigger><PopoverContent className="space-y-3"><h3 className="font-medium">title</h3><p className="text-sm text-muted-foreground">description</p><Button variant="outline" onClick={() => setOpen(false)}>close</Button></PopoverContent></Popover>
}
