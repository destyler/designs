// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Progress } from '@/registry/new-york-v4/ui/progress'

export default function Example() {
  const [value, setValue] = useState(65)
  return <div className="w-64 space-y-4"><p id="reference-progress-label">Label <span role="status">{value}%</span></p><Progress value={value} aria-valuenow={value} aria-valuetext={`${value}%`} aria-labelledby="reference-progress-label" /><Button variant="outline" onClick={() => setValue(current => current >= 100 ? 0 : Math.min(100, current + 10))}>Advance</Button></div>
}
