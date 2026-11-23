import { Toggle as Primitive } from '@destyler-ui/solid/toggle'
import { validateAccessibleText } from '../accessible-text'
import type { ToggleProps } from '../Toggle'

export function Toggle(props: ToggleProps) {
  // The locked Solid primitive accepts an accessor for controlled pressed state.
  return <div class="rd-component">
    <Primitive.Root pressed={props.pressed === undefined ? undefined : () => props.pressed ?? false}
      defaultPressed={props.defaultPressed} disabled={props.disabled}
      onPressedChange={pressed => props.onPressedChange?.(pressed)}>
      {validateAccessibleText(props.label, 'Toggle', 'label')}
    </Primitive.Root>
  </div>
}
