import { Tour, useTour } from '@destyler-ui/solid/tour'
import { XIcon } from '../../icons'
import { For } from 'solid-js'
import { steps } from './steps'

export function DemoTour() {
  const tour = useTour({ steps })

  return (
    <>
      <button type="button" onClick={() => tour().start()}>Start tour</button>
      <Tour.Root tour={tour}>
      <Tour.Backdrop />
      <Tour.Spotlight />
      <Tour.Positioner>
        <Tour.Content>
          <Tour.Arrow>
            <Tour.ArrowTip />
          </Tour.Arrow>
          <Tour.Title />
          <Tour.Description />
          <Tour.ProgressText />
          <Tour.CloseTrigger>
            <XIcon />
          </Tour.CloseTrigger>
          <Tour.Control>
            <Tour.Actions>
              {actions => (
                <For each={actions()}>{action => <Tour.ActionTrigger action={action} />}</For>
              )}
            </Tour.Actions>
          </Tour.Control>
        </Tour.Content>
      </Tour.Positioner>
      </Tour.Root>
    </>
  )
}
