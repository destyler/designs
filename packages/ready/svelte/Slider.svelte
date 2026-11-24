<script lang="ts">
  import { Slider as Primitive } from '@destyler-ui/svelte/slider';
  import { resolveSlider, type SliderProps } from '../Slider';

  let props: SliderProps = $props();
  const resolved = $derived(resolveSlider(props));
</script>

<Primitive.Root class="rd-component rd-slider" min={resolved.min} max={resolved.max} step={resolved.step}
  value={resolved.value} defaultValue={resolved.defaultValue} name={props.name} disabled={props.disabled}
  thumbAlignment="center" onValueChange={event => props.onValueChange?.(event.value[0])}>
  <Primitive.Label>{resolved.label}</Primitive.Label>
  <div class="rd-slider-control-wrap"><Primitive.Control>
    <Primitive.Track><Primitive.Range /></Primitive.Track>
    <Primitive.Thumb index={0}><Primitive.HiddenInput disabled={props.disabled} /></Primitive.Thumb>
  </Primitive.Control></div>
</Primitive.Root>
