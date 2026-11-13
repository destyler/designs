// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Separator } from '@/registry/new-york-v4/ui/separator'

export default function Example() {
  return <div className="w-64 space-y-4"><div><h3 className="font-medium">shadcn/ui</h3><p className="text-sm text-muted-foreground">Original New York components.</p></div><Separator /><div className="flex h-5 items-center gap-4 text-sm"><span>Blog</span><Separator orientation="vertical" /><span>Docs</span><Separator orientation="vertical" /><span>Source</span></div></div>
}
