// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Label } from '@/registry/new-york-v4/ui/label'
import { Input } from '@/registry/new-york-v4/ui/input'

export default function Example() {
  return <div className="w-64 space-y-3"><Label htmlFor="reference-username">Username</Label><Input id="reference-username" autoComplete="off" /></div>
}
