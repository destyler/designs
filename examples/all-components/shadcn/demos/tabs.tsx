// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs'

export default function Example() {
  return <Tabs defaultValue="React" className="w-full max-w-md"><TabsList>{['React', 'Solid', 'Svelte', 'Vue'].map(item => <TabsTrigger key={item} value={item} disabled={item === 'Svelte'}>{item} Trigger</TabsTrigger>)}</TabsList>{['React', 'Solid', 'Svelte', 'Vue'].map(item => <TabsContent key={item} value={item} className="rounded-md border p-4">{item} Content</TabsContent>)}</Tabs>
}
