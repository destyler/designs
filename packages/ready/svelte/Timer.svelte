<script lang="ts">
  import { Timer as Primitive } from '@destyler-ui/svelte/timer'
  import { readyTimerInterval, resetReadyTimer, timerAction, timerActionLabel, timerDisplay, timerText, type TimerProps } from '../Timer'

  let { label, startLabel, pauseLabel, resumeLabel, resetLabel }: TimerProps = $props()
  const text = $derived(timerText({ label, startLabel, pauseLabel, resumeLabel, resetLabel }))
</script>

<div class="rd-component rd-timer">
  <Primitive.Root role="group" aria-label={text.label} interval={readyTimerInterval}>
    <Primitive.Context>
      {#snippet api(timer)}
        <Primitive.Area aria-live="off">{timerDisplay(timer().formattedTime)}</Primitive.Area>
        <Primitive.Control>
          <Primitive.ActionTrigger action={timerAction(timer())} class="rd-button">{timerActionLabel(timer(), text)}</Primitive.ActionTrigger>
          <button type="button" class="rd-button" onclick={() => resetReadyTimer(timer())}>{text.resetLabel}</button>
        </Primitive.Control>
      {/snippet}
    </Primitive.Context>
  </Primitive.Root>
</div>
