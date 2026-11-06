// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Button } from '@/registry/new-york-v4/ui/button'

// Application composition, not an official shadcn Clipboard primitive.
export default function Example() {
  const value = 'https://destyler.org'
  const [status, setStatus] = useState('Not copied')
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(value)
      setStatus('Copied')
    } catch {
      setStatus('Copy unavailable. Select the link and copy it manually.')
    }
  }
  return <div className="space-y-3"><p className="text-sm font-medium">Copy this link</p><p className="select-all rounded-md border p-3 text-sm">{value}</p><Button variant="outline" onClick={copy}>Copy link</Button><p role="status" className="text-sm text-muted-foreground">{status}</p></div>
}
