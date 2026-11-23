import type { JSX } from 'solid-js'
import { Label as Primitive } from '@destyler-ui/solid/label'
import type { LabelProps } from '../Label'

export function Label(props: LabelProps & { children?: JSX.Element }) {
  return <Primitive.Root class="rd-component" for={props.for}>{props.children}</Primitive.Root>
}
