import { AspectRatio as Primitive } from '@destyler-ui/solid/aspect-ratio';
import type { JSX } from 'solid-js';
import { type AspectRatioProps, validateAspectRatio } from '../AspectRatio';

export function AspectRatio(props: AspectRatioProps & { children?: JSX.Element }) {
  return (
    <Primitive.Root ratio={validateAspectRatio(props.ratio)}>
      <Primitive.Content>{props.children}</Primitive.Content>
    </Primitive.Root>
  );
}
