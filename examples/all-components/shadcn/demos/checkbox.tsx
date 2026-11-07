// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Checkbox } from '@/registry/new-york-v4/ui/checkbox'
import { Label } from '@/registry/new-york-v4/ui/label'

export default function Example() {
  return <div className="flex items-center gap-3"><Checkbox id="reference-checkbox" /><Label htmlFor="reference-checkbox">Checkbox</Label></div>
}
