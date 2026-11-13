// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Calendar } from '@/registry/new-york-v4/ui/calendar'

export default function Example() {
  const [date, setDate] = useState<Date | undefined>()
  // Native Calendar defaults to UTC. Compare the same current day, not a frozen
  // November 6 highlight that diverges from the four actual primitives.
  const now = new Date()
  const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return <div className="space-y-3"><Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 10, 1)} today={today} captionLayout="dropdown" startMonth={new Date(2020, 0)} endMonth={new Date(2030, 11)} className="rounded-md border" /><p role="status" className="text-sm text-muted-foreground">{date ? `Selected: ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : 'Select a date'}</p></div>
}
