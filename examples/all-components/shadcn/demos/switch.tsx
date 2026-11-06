// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Label } from '@/registry/new-york-v4/ui/label'
import { Switch } from '@/registry/new-york-v4/ui/switch'

export default function Example() {
  return <div className="flex items-center gap-3"><Switch id="reference-switch" /><Label htmlFor="reference-switch">Label</Label></div>
}
