import { validateAccessibleText } from './accessible-text'

export interface TimerProps {
  label: string
  startLabel?: string
  pauseLabel?: string
  resumeLabel?: string
  resetLabel?: string
}

export const readyTimerInterval = 1000

export function timerText({ label, startLabel = 'Start', pauseLabel = 'Pause', resumeLabel = 'Resume', resetLabel = 'Reset' }: TimerProps) {
  const text = { label, startLabel, pauseLabel, resumeLabel, resetLabel }
  for (const [prop, value] of Object.entries(text)) validateAccessibleText(value, 'Timer', prop)
  return text
}

type TimerActionState = { running: boolean; paused: boolean }

export function timerAction({ running, paused }: TimerActionState) {
  return running ? 'pause' : paused ? 'resume' : 'start'
}

export function timerActionLabel(state: TimerActionState, text: ReturnType<typeof timerText>) {
  return state.running ? text.pauseLabel : state.paused ? text.resumeLabel : text.startLabel
}

export function timerDisplay({ days, hours, minutes, seconds }: { days: string; hours: string; minutes: string; seconds: string }) {
  const time = `${hours}:${minutes}:${seconds}`
  return Number(days) ? `${days}:${time}` : time
}

/** The pinned Reset preserves running; Pause first to return to the initial idle state. */
export function resetReadyTimer(timer: { running: boolean; pause: () => void; reset: () => void }) {
  if (timer.running) timer.pause()
  timer.reset()
}
