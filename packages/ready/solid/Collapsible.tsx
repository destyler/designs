import { createMemo, type JSX } from 'solid-js';
import { Collapsible as Primitive } from '@destyler-ui/solid';
import type { CollapsibleProps } from '../Collapsible';
import { validateAccessibleText } from '../accessible-text';

export function Collapsible(props: CollapsibleProps & { children?: JSX.Element }) {
  const text = createMemo(() => validateAccessibleText(props.trigger, 'Collapsible', 'trigger'));
  return <Primitive.Root class="rd-component" open={props.open} defaultOpen={props.defaultOpen} disabled={props.disabled} onOpenChange={({ open }) => props.onOpenChange?.(open)}>
    <Primitive.Trigger class="rd-button" disabled={props.disabled}>{text()}</Primitive.Trigger>
    <Primitive.Content>{props.children}</Primitive.Content>
  </Primitive.Root>;
}
