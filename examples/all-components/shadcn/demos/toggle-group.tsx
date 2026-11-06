// Demo composition is application code. Imports preserve original pinned shadcn source.
import { ToggleGroup, ToggleGroupItem } from '@/registry/new-york-v4/ui/toggle-group'

export default function Example() {
  return <ToggleGroup type="single" variant="outline" aria-label="Select a letter">{['A', 'B', 'C'].map(item => <ToggleGroupItem key={item} value={item.toLowerCase()} aria-label={item}>{item}</ToggleGroupItem>)}</ToggleGroup>
}
