// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '@/registry/new-york-v4/ui/combobox'
import { Label } from '@/registry/new-york-v4/ui/label'

const frameworks = ['React', 'Solid', 'Vue', 'Svelte']
export default function Example() {
  const [value, setValue] = useState<string | null>(null)
  // The pinned Input convenience icons have no accessible names. Use the
  // original exported Trigger with an explicit label and a labeled Button
  // for controlled clearing instead; do not rewrite vendor source or DOM.
  return <div className="w-full max-w-sm space-y-3">
    <Label htmlFor="reference-combobox">Framework</Label>
    <Combobox items={frameworks} value={value} onValueChange={setValue}>
      <div className="flex min-w-0 items-center gap-2">
        <ComboboxInput id="reference-combobox" placeholder="Select a framework" showTrigger={false} showClear={false} />
        <ComboboxTrigger aria-label="Open framework options" render={<Button variant="outline" size="icon" />} />
        <Button variant="outline" disabled={!value} onClick={() => setValue(null)}>Clear</Button>
      </div>
      <ComboboxContent><ComboboxEmpty>No frameworks found.</ComboboxEmpty><ComboboxList>{(item: string) => <ComboboxItem key={item} value={item} disabled={item === 'Svelte'}>{item}</ComboboxItem>}</ComboboxList></ComboboxContent>
    </Combobox>
    <p role="status" className="text-sm text-muted-foreground">{value || 'No selection'}</p>
  </div>
}
