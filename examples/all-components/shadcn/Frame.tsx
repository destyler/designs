import { useEffect } from 'react'
import { examples, type Family } from './registry'

export function Frame({ family, theme, valid = true }: { family: Family; theme: 'light' | 'dark'; valid?: boolean }) {
  const Example = examples[family]
  useEffect(() => {
    // The host accepts only a message from the current frame window and selection.
    // An import or iframe load event alone must never claim a mounted example.
    if (valid) window.parent.postMessage({ type: 'destyler:all-components-ready', framework: 'shadcn', family, theme }, window.location.origin)
  }, [family, theme, valid])
  return <Example />
}
