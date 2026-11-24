import { useEffect, useId, useRef } from 'react'
import { NumberInput as Primitive, useFieldContext } from '@destyler-ui/react'
import { numberInputOptions, type NumberInputProps } from '../NumberInput'
import { describeField } from '../switch-description'

export function NumberInput({ label, min, max, step, description, error, onValueChange, ...state }: NumberInputProps) {
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const field = useFieldContext()
  const text = describeField(id, description, error, field?.ariaDescribedby)
  useEffect(() => { input.current?.setCustomValidity(error ?? '') }, [error])
  return <div className="rd-component">
    <Primitive.Root {...numberInputOptions({ label, min, max, step })} {...state}
      invalid={Boolean(error) || field?.invalid} onValueChange={event => onValueChange?.(event.value)}>
      <Primitive.Label>{label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.DecrementTrigger><span aria-hidden="true">−</span></Primitive.DecrementTrigger>
        <Primitive.Input ref={input} aria-describedby={text.describedBy} />
        <Primitive.IncrementTrigger><span aria-hidden="true">+</span></Primitive.IncrementTrigger>
      </Primitive.Control>
    </Primitive.Root>
    {text.hasDescription && <p id={text.descriptionId} className="rd-description">{description}</p>}
    {error && <p id={text.errorId} className="rd-error">{error}</p>}
  </div>
}
