import { createMemo, createSignal, createUniqueId, For, Show } from 'solid-js'
import { ColorPicker as Primitive, parseColor } from '@destyler-ui/solid/color-picker'
import { colorPickerModel, commitColorInput, handleColorInputKey, initialColor, type ColorPickerProps } from '../ColorPicker'

export function ColorPicker(props: ColorPickerProps) {
  const [local, setLocal] = createSignal(initialColor(props.defaultValue))
  const model = createMemo(() => colorPickerModel(props, local()))
  const selected = createMemo(() => parseColor(model().color))
  const id = createUniqueId()

  function change(next: string) {
    if (props.disabled || next === model().color) return
    if (props.value === undefined) setLocal(next)
    props.onValueChange?.(next)
  }

  return <Primitive.Root class="rd-component rd-color-picker" value={selected()} disabled={props.disabled}
    onValueChange={({ value }) => change(value.toString('hex'))}>
    <label for={id}>{model().label}</label>
    <Primitive.Control>
      <input id={id} class="rd-color-hex" type="text" value={model().color} disabled={props.disabled}
        autocomplete="off" spellcheck={false}
        onBlur={event => commitColorInput(event.currentTarget, model().color, change)}
        onKeyDown={event => handleColorInputKey(event, event.currentTarget, model().color, change)} />
      <Primitive.ValueSwatch aria-hidden="true" />
    </Primitive.Control>
    <Show when={model().presets.length > 0}>
      <Primitive.SwatchGroup aria-label="Preset colors">
        <For each={model().presets}>{preset =>
          <Primitive.SwatchTrigger value={preset} aria-label={`Select ${preset}`} aria-pressed={preset === model().color} />
        }</For>
      </Primitive.SwatchGroup>
    </Show>
  </Primitive.Root>
}
