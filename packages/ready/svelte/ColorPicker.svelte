<script lang="ts">
  import { untrack } from 'svelte'
  import { ColorPicker as Primitive, parseColor } from '@destyler-ui/svelte/color-picker'
  import { colorPickerModel, commitColorInput, handleColorInputKey, initialColor, type ColorPickerProps } from '../ColorPicker'

  const props: ColorPickerProps = $props()
  let local = $state(untrack(() => initialColor(props.defaultValue)))
  const model = $derived(colorPickerModel(props, local))
  const selected = $derived(parseColor(model.color))
  const id = $props.id()

  function change(next: string) {
    if (props.disabled || next === model.color) return
    if (props.value === undefined) local = next
    props.onValueChange?.(next)
  }
</script>

<Primitive.Root class="rd-component rd-color-picker" value={selected} disabled={props.disabled}
  onValueChange={({ value }) => change(value.toString('hex'))}>
  <label for={id}>{model.label}</label>
  <Primitive.Control>
    <input {id} class="rd-color-hex" type="text" value={model.color} disabled={props.disabled}
      autocomplete="off" spellcheck={false}
      onblur={event => commitColorInput(event.currentTarget, model.color, change)}
      onkeydown={event => handleColorInputKey(event, event.currentTarget, model.color, change)} />
    <Primitive.ValueSwatch aria-hidden="true" />
  </Primitive.Control>
  {#if model.presets.length}
    <Primitive.SwatchGroup aria-label="Preset colors">
      {#each model.presets as preset (preset)}
        <Primitive.SwatchTrigger value={preset} aria-label={`Select ${preset}`} aria-pressed={preset === model.color} />
      {/each}
    </Primitive.SwatchGroup>
  {/if}
</Primitive.Root>
