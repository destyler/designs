// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Slider } from '@/registry/new-york-v4/ui/slider'

export default function Example() {
  const [value, setValue] = useState([-20, 20])
  return <div className="w-64 space-y-4"><p id="reference-slider-label">Quantity: <span role="status">{value.join(', ')}</span></p><Slider aria-labelledby="reference-slider-label" min={-50} max={50} value={value} onValueChange={setValue} /></div>
}
