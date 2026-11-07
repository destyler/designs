// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/registry/new-york-v4/ui/field'
import { Input } from '@/registry/new-york-v4/ui/input'

export default function Example() {
  return <FieldSet className="w-full max-w-sm" aria-describedby="reference-set-description reference-set-error"><FieldLegend>Legend</FieldLegend><FieldDescription id="reference-set-description">Fieldset Helper Text</FieldDescription><FieldError id="reference-set-error">Fieldset Error Text</FieldError><Field><FieldLabel htmlFor="reference-set-input">Label</FieldLabel><Input id="reference-set-input" aria-describedby="reference-set-help" /><FieldDescription id="reference-set-help">Field Helper Text</FieldDescription></Field></FieldSet>
}
