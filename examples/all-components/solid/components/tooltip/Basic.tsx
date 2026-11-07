import { Tooltip } from '@destyler-ui/solid/tooltip'
import { Portal } from 'solid-js/web'

export function Basic() {
  return (
    <Tooltip.Root openDelay={0} closeDelay={0}>
      <Tooltip.Trigger>hover me</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Arrow><Tooltip.ArrowTip /></Tooltip.Arrow><Tooltip.Content>content</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
