// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/registry/new-york-v4/ui/navigation-menu'

export default function Example() {
  const [selected, setSelected] = useState('')
  const link = (title: string) => <NavigationMenuLink href={`#${title.toLowerCase().replaceAll(' ', '-')}`} onClick={event => { event.preventDefault(); setSelected(title) }}>{title}</NavigationMenuLink>
  return <div className="space-y-4"><NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuTrigger>Getting started</NavigationMenuTrigger><NavigationMenuContent><div className="grid w-64 gap-2 p-3">{['Introduction', 'Installation', 'Typography'].map(title => <div key={title}>{link(title)}</div>)}</div></NavigationMenuContent></NavigationMenuItem><NavigationMenuItem><NavigationMenuTrigger>Components</NavigationMenuTrigger><NavigationMenuContent><div className="grid w-64 gap-2 p-3">{['Alert Dialog', 'Hover Card', 'Progress'].map(title => <div key={title}>{link(title)}</div>)}</div></NavigationMenuContent></NavigationMenuItem><NavigationMenuItem><NavigationMenuLink className={navigationMenuTriggerStyle()} href="#documentation" onClick={event => { event.preventDefault(); setSelected('Documentation') }}>Documentation</NavigationMenuLink></NavigationMenuItem></NavigationMenuList></NavigationMenu><p role="status" className="text-sm text-muted-foreground">{selected || 'Choose a section'}</p></div>
}
