// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Fragment } from 'react'
import { ScrollArea, ScrollBar } from '@/registry/new-york-v4/ui/scroll-area'
import { Separator } from '@/registry/new-york-v4/ui/separator'

export default function Example() {
  return <ScrollArea className="h-72 w-52 rounded-md border"><div className="min-w-64 p-4"><h3 className="mb-3 font-medium">Tags</h3>{Array.from({ length: 50 }, (_, index) => <Fragment key={index}><p className="py-2 text-sm">v1.2.0-beta.{50 - index}</p><Separator /></Fragment>)}</div><ScrollBar orientation="horizontal" /></ScrollArea>
}
