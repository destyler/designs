// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/registry/new-york-v4/ui/accordion'

export default function Example() {
  return <Accordion type="single" collapsible defaultValue="Vue" className="w-full max-w-sm">{['React', 'Solid', 'Svelte', 'Vue'].map(item => <AccordionItem value={item} key={item} disabled={item === 'Svelte'}><AccordionTrigger>{item} trigger</AccordionTrigger><AccordionContent>{item} Content</AccordionContent></AccordionItem>)}</Accordion>
}
