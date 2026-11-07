// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Fragment, useState } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/registry/new-york-v4/ui/breadcrumb'

export default function Example() {
  const [destination, setDestination] = useState('Smartphones')
  return <div className="space-y-4"><Breadcrumb><BreadcrumbList>{['Home', 'Products', 'Electronics'].map(label => <Fragment key={label}><BreadcrumbItem><BreadcrumbLink href={`#${label.toLowerCase()}`} onClick={event => { event.preventDefault(); setDestination(label) }}>{label}</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /></Fragment>)}<BreadcrumbItem><BreadcrumbPage>Smartphones</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><p role="status" className="text-sm text-muted-foreground">Selected: {destination}</p></div>
}
