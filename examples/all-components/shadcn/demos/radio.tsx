// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Label } from '@/registry/new-york-v4/ui/label'
import { RadioGroup, RadioGroupItem } from '@/registry/new-york-v4/ui/radio-group'

export default function Example() {
  const [value, setValue] = useState('')
  return <div className="space-y-4"><p id="reference-radio-label" className="text-sm font-medium">Framework</p><RadioGroup value={value} onValueChange={setValue} aria-labelledby="reference-radio-label">{['React', 'Solid', 'Vue', 'Svelte'].map(item => <div key={item} className="flex items-center gap-3"><RadioGroupItem value={item.toLowerCase()} id={`reference-radio-${item}`} disabled={item === 'Svelte'} /><Label htmlFor={`reference-radio-${item}`}>{item}</Label></div>)}</RadioGroup><p role="status" className="text-sm text-muted-foreground">{value || 'No selection'}</p></div>
}
