// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Button } from '@/registry/new-york-v4/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/registry/new-york-v4/ui/dropdown-menu'

export default function Example() {
  const [checked, setChecked] = useState(false)
  const [framework, setFramework] = useState('')
  const [css, setCss] = useState('')
  return <div className="space-y-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Framework menu</DropdownMenuLabel><DropdownMenuItem disabled>Dialog</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>Check me</DropdownMenuCheckboxItem><DropdownMenuSeparator /><DropdownMenuLabel>JS Frameworks</DropdownMenuLabel><DropdownMenuRadioGroup value={framework} onValueChange={setFramework}>{['react', 'solid', 'vue', 'svelte'].map(item => <DropdownMenuRadioItem key={item} value={item}>{item}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup><DropdownMenuSeparator /><DropdownMenuSub><DropdownMenuSubTrigger>CSS Frameworks</DropdownMenuSubTrigger><DropdownMenuSubContent>{['UnoCSS', 'Tailwind'].map(item => <DropdownMenuItem key={item} onSelect={() => setCss(item)}>{item}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub></DropdownMenuContent></DropdownMenu><p role="status" className="text-sm text-muted-foreground">{framework || 'No framework'}{css ? ` · ${css}` : ''}{checked ? ' · Checked' : ''}</p></div>
}
