import { AspectRatio as Primitive } from '@destyler-ui/react';
import type { ReactNode } from 'react';
import { type AspectRatioProps, validateAspectRatio } from '../AspectRatio';

export function AspectRatio({ ratio, children }: AspectRatioProps & { children?: ReactNode }) {
  return (
    <Primitive.Root ratio={validateAspectRatio(ratio)}>
      <Primitive.Content>{children}</Primitive.Content>
    </Primitive.Root>
  );
}
