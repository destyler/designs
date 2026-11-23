import { createMemo } from 'solid-js'
import { Timer as Primitive } from '@destyler-ui/solid/timer'
import { readyTimerInterval, resetReadyTimer, timerAction, timerActionLabel, timerDisplay, timerText, type TimerProps } from '../Timer'

export function Timer(props: TimerProps) {
  const text = createMemo(() => timerText(props))
  return <div class="rd-component rd-timer">
    <Primitive.Root role="group" aria-label={text().label} interval={readyTimerInterval}>
      <Primitive.Context>{timer => <>
        <Primitive.Area aria-live="off">{timerDisplay(timer().formattedTime)}</Primitive.Area>
        <Primitive.Control>
          <Primitive.ActionTrigger action={timerAction(timer())} class="rd-button">{timerActionLabel(timer(), text())}</Primitive.ActionTrigger>
          <button type="button" class="rd-button" onClick={() => resetReadyTimer(timer())}>{text().resetLabel}</button>
        </Primitive.Control>
      </>}</Primitive.Context>
    </Primitive.Root>
  </div>
}
