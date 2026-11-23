import { useId, type ReactNode } from 'react'
import { Fieldset as Primitive } from '@destyler-ui/react'
import { validateAccessibleText } from '../accessible-text'
import type { FieldsetProps } from '../Fieldset'

export function Fieldset({ legend, description, disabled, children }: FieldsetProps & { children?: ReactNode }) {
  const descriptionId = useId()
  return <Primitive.Root className="rd-component" disabled={disabled} aria-describedby={description?.trim() ? descriptionId : undefined}>
    <Primitive.Legend>{validateAccessibleText(legend, 'Fieldset', 'legend')}</Primitive.Legend>
    {description?.trim() && <p id={descriptionId} className="rd-description">{description}</p>}
    {children}
  </Primitive.Root>
}
