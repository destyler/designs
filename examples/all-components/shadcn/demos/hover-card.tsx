// Demo composition is application code. Imports preserve original pinned shadcn source.
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/registry/new-york-v4/ui/hover-card'
import { Button } from '@/registry/new-york-v4/ui/button'

export default function Example() {
  return <HoverCard openDelay={0} closeDelay={0}><HoverCardTrigger asChild><Button variant="link">Hover me</Button></HoverCardTrigger><HoverCardContent>Content</HoverCardContent></HoverCard>
}
