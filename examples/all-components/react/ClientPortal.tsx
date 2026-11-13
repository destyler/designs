import { useEffect, useState, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

// Server and first hydration render both omit the portal. Mounting after the
// effect avoids document access on the server and preserves matching markup.
export function ClientPortal({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? createPortal(children, document.body) : null
}
