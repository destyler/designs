import { Toggle as Primitive } from '@destyler-ui/react'
import { validateAccessibleText } from '../accessible-text'
import type { ToggleProps } from '../Toggle'

export function Toggle({ label, pressed, defaultPressed, disabled, onPressedChange }: ToggleProps) {
  return <div className="rd-component">
    <Primitive.Root pressed={pressed} defaultPressed={defaultPressed} disabled={disabled} onPressedChange={onPressedChange}>
      {validateAccessibleText(label, 'Toggle', 'label')}
    </Primitive.Root>
  </div>
}
