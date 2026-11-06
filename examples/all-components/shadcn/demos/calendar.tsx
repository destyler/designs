// Demo composition is application code. Imports preserve original pinned shadcn source.
import { useState } from 'react'
import { Calendar } from '@/registry/new-york-v4/ui/calendar'

export default function Example() {
  const [date, setDate] = useState<Date | undefined>()
  return <div className="space-y-3"><Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 10, 1)} today={new Date(2026, 10, 6)} captionLayout="dropdown" startMonth={new Date(2020, 0)} endMonth={new Date(2030, 11)} className="rounded-md border" /><p role="status" className="text-sm text-muted-foreground">{date ? `Selected: ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : 'Select a date'}</p></div>
}
