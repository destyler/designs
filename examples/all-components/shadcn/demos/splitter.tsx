// Demo composition is application code. Imports preserve original pinned shadcn source.
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/registry/new-york-v4/ui/resizable'

export default function Example() {
  return <ResizablePanelGroup orientation="horizontal" className="min-h-40 w-full max-w-sm rounded-md border"><ResizablePanel id="reference-a" defaultSize="50%" minSize="20%"><div className="flex h-40 items-center justify-center">A</div></ResizablePanel><ResizableHandle withHandle aria-label="Resize A and B panels" /><ResizablePanel id="reference-b" defaultSize="50%" minSize="20%"><div className="flex h-40 items-center justify-center">B</div></ResizablePanel></ResizablePanelGroup>
}
