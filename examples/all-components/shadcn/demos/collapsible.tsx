// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/new-york-v4/ui/collapsible'
import { Button } from '@/registry/new-york-v4/ui/button'

export default function Example() {
  return <Collapsible className="space-y-3"><CollapsibleTrigger asChild><Button variant="outline">Toggle</Button></CollapsibleTrigger><CollapsibleContent className="rounded-md border p-4">Content</CollapsibleContent></Collapsible>
}
