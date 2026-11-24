import { Separator as Primitive } from '@destyler-ui/solid/separator';
import type { SeparatorProps } from '../Separator';

export function Separator(props: SeparatorProps) {
  return <Primitive.Root class="rd-component" orientation={props.orientation ?? 'horizontal'} />;
}
