import { Slider as Primitive } from '@destyler-ui/react';
import { resolveSlider, type SliderProps } from '../Slider';

export function Slider(props: SliderProps) {
  const { label, ...resolved } = resolveSlider(props);
  return <Primitive.Root className="rd-component rd-slider" {...resolved} name={props.name} disabled={props.disabled}
    thumbAlignment="center" onValueChange={event => props.onValueChange?.(event.value[0])}>
    <Primitive.Label>{label}</Primitive.Label>
    <div className="rd-slider-control-wrap"><Primitive.Control>
      <Primitive.Track><Primitive.Range /></Primitive.Track>
      <Primitive.Thumb index={0}><Primitive.HiddenInput disabled={props.disabled} /></Primitive.Thumb>
    </Primitive.Control></div>
  </Primitive.Root>;
}
