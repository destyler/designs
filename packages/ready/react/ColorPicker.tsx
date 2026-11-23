import { useId, useLayoutEffect, useRef, useState } from 'react'
import { ColorPicker as Primitive, parseColor } from '@destyler-ui/react'
import { colorPickerModel, commitColorInput, handleColorInputKey, initialColor, type ColorPickerProps } from '../ColorPicker'

export function ColorPicker(props: ColorPickerProps) {
  const [local, setLocal] = useState(() => initialColor(props.defaultValue))
  const { label, color, presets } = colorPickerModel(props, local)
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => { if (input.current) input.current.value = color }, [color])

  function change(next: string) {
    if (props.disabled || next === color) return
    if (props.value === undefined) setLocal(next)
    props.onValueChange?.(next)
  }

  return <Primitive.Root className="rd-component rd-color-picker" value={parseColor(color)} disabled={props.disabled}
    onValueChange={({ value }) => change(value.toString('hex'))}>
    <label htmlFor={id}>{label}</label>
    <Primitive.Control>
      <input ref={input} id={id} className="rd-color-hex" type="text" defaultValue={color} disabled={props.disabled}
        autoComplete="off" spellCheck={false}
        onBlur={event => commitColorInput(event.currentTarget, color, change)}
        onKeyDown={event => handleColorInputKey(event.nativeEvent, event.currentTarget, color, change)} />
      <Primitive.ValueSwatch aria-hidden="true" />
    </Primitive.Control>
    {presets.length > 0 && <Primitive.SwatchGroup aria-label="Preset colors">
      {presets.map(preset => <Primitive.SwatchTrigger key={preset} value={preset} aria-label={`Select ${preset}`} aria-pressed={preset === color} />)}
    </Primitive.SwatchGroup>}
  </Primitive.Root>
}
