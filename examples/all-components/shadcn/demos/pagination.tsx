// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/registry/new-york-v4/ui/pagination'

export default function Example() {
  const [page, setPage] = useState(1)
  const pages = Array.from(new Set([1, ...Array.from({ length: 5 }, (_, index) => page - 2 + index).filter(value => value > 1 && value < 10), 10])).sort((a, b) => a - b)
  return <div className="space-y-4"><Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#previous" aria-disabled={page === 1} onClick={event => { event.preventDefault(); setPage(Math.max(1, page - 1)) }} /></PaginationItem>{pages.flatMap((value, index) => [index > 0 && value - pages[index - 1] > 1 ? <PaginationItem key={`gap-${value}`}><PaginationEllipsis /></PaginationItem> : null, <PaginationItem key={value}><PaginationLink href={`#page-${value}`} isActive={page === value} onClick={event => { event.preventDefault(); setPage(value) }}>{value}</PaginationLink></PaginationItem>])}<PaginationItem><PaginationNext href="#next" aria-disabled={page === 10} onClick={event => { event.preventDefault(); setPage(Math.min(10, page + 1)) }} /></PaginationItem></PaginationContent></Pagination><p role="status" className="text-sm text-muted-foreground">Page {page} of 10 · 100 items</p></div>
}
