// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Label } from '@/registry/new-york-v4/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select'

export default function Example() {
  const [value, setValue] = useState('')
  return <div className="w-64 space-y-3"><Label htmlFor="reference-select">Framework</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="reference-select" className="w-full"><SelectValue placeholder="Select a Framework" /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Frameworks</SelectLabel>{['React', 'Solid', 'Vue', 'Svelte'].map(item => <SelectItem key={item} value={item.toLowerCase()} disabled={item === 'Svelte'}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select><p role="status" className="text-sm text-muted-foreground">{value || 'No selection'}</p></div>
}
