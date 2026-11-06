// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Toaster } from '@/registry/new-york-v4/ui/sonner'

export default function Example() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => { setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light'); return () => { toast.dismiss() } }, [])
  return <><Button variant="outline" onClick={() => toast.info('Title', { description: 'Description', action: { label: 'Action', onClick: () => toast.dismiss() } })}>Create Toast</Button><Toaster theme={theme} position="bottom-right" closeButton /></>
}
