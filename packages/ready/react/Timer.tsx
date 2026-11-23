import { Timer as Primitive } from '@destyler-ui/react'
import { readyTimerInterval, resetReadyTimer, timerAction, timerActionLabel, timerDisplay, timerText, type TimerProps } from '../Timer'

export function Timer(props: TimerProps) {
  const text = timerText(props)
  return <div className="rd-component rd-timer">
    <Primitive.Root role="group" aria-label={text.label} interval={readyTimerInterval}>
      <Primitive.Context>{timer => <>
        <Primitive.Area aria-live="off">{timerDisplay(timer.formattedTime)}</Primitive.Area>
        <Primitive.Control>
          <Primitive.ActionTrigger action={timerAction(timer)} className="rd-button">{timerActionLabel(timer, text)}</Primitive.ActionTrigger>
          <button type="button" className="rd-button" onClick={() => resetReadyTimer(timer)}>{text.resetLabel}</button>
        </Primitive.Control>
      </>}</Primitive.Context>
    </Primitive.Root>
  </div>
}
