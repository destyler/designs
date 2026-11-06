// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Field, FieldDescription, FieldError, FieldLabel } from '@/registry/new-york-v4/ui/field'
import { Input } from '@/registry/new-york-v4/ui/input'

export default function Example() {
  return <Field data-invalid="true" className="max-w-sm"><FieldLabel htmlFor="reference-field">Label <span aria-hidden="true">*</span></FieldLabel><Input id="reference-field" required aria-invalid="true" aria-describedby="reference-field-description reference-field-error" /><FieldDescription id="reference-field-description">Some additional Info</FieldDescription><FieldError id="reference-field-error">Error Info</FieldError></Field>
}
