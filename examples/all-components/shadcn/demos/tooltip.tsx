// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Button } from '@/registry/new-york-v4/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/new-york-v4/ui/tooltip'

export default function Example() {
  return <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild><Button variant="outline">hover me</Button></TooltipTrigger><TooltipContent>content</TooltipContent></Tooltip></TooltipProvider>
}
