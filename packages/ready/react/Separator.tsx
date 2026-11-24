import { Separator as Primitive } from '@destyler-ui/react';
import type { SeparatorProps } from '../Separator';

export function Separator({ orientation = 'horizontal' }: SeparatorProps) {
  return <Primitive.Root className="rd-component" orientation={orientation} />;
}
