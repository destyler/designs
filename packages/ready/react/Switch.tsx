import { useEffect, useId, useRef } from 'react'
import { Switch as Primitive, useFieldContext } from '@destyler-ui/react'
import { validateAccessibleText } from '../accessible-text'
import { describeField } from '../switch-description'
import type { SwitchProps } from '../types'

export function Switch({ label, description, error, onCheckedChange, ...state }: SwitchProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const field = useFieldContext()
  const { hasDescription, descriptionId, errorId, describedBy } = describeField(id, description, error, field?.ariaDescribedby)
  useEffect(() => { input.current?.setCustomValidity(error ?? '') }, [error])
  return <div className="rd-component">
    <Primitive.Root {...state} invalid={Boolean(error) || field?.invalid} onCheckedChange={event => onCheckedChange?.(event.checked)}>
      <Primitive.Control><Primitive.Thumb /></Primitive.Control>
      <Primitive.Label>{validateAccessibleText(label, 'Switch', 'label')}</Primitive.Label>
      <Primitive.HiddenInput ref={input} role="switch" aria-describedby={describedBy} />
    </Primitive.Root>
    {hasDescription && <p id={descriptionId} className="rd-description">{description}</p>}
    {error && <p id={errorId} className="rd-error">{error}</p>}
  </div>
}
