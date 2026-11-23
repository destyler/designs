import type { ReactNode } from 'react';
import { Collapsible as Primitive } from '@destyler-ui/react';
import type { CollapsibleProps } from '../Collapsible';
import { validateAccessibleText } from '../accessible-text';

export function Collapsible({ trigger, open, defaultOpen, disabled, onOpenChange, children }: CollapsibleProps & { children?: ReactNode }) {
  const text = validateAccessibleText(trigger, 'Collapsible', 'trigger');
  return <Primitive.Root className="rd-component" open={open} defaultOpen={defaultOpen} disabled={disabled} onOpenChange={({ open: next }) => onOpenChange?.(next)}>
    <Primitive.Trigger className="rd-button" disabled={disabled}>{text}</Primitive.Trigger>
    <Primitive.Content>{children}</Primitive.Content>
  </Primitive.Root>;
}
