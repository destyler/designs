<script setup lang="ts">
import { computed } from 'vue'
import { Timer as Primitive } from '@destyler-ui/vue'
import { readyTimerInterval, resetReadyTimer, timerAction, timerActionLabel, timerDisplay, timerText, type TimerProps } from '../Timer'

const props = defineProps<TimerProps>()
const text = computed(() => timerText(props))
</script>

<template>
  <div class="rd-component rd-timer">
    <Primitive.Root role="group" :aria-label="text.label" :interval="readyTimerInterval">
      <Primitive.Context v-slot="timer">
        <Primitive.Area aria-live="off">{{ timerDisplay(timer.formattedTime) }}</Primitive.Area>
        <Primitive.Control>
          <Primitive.ActionTrigger :action="timerAction(timer)" class="rd-button">{{ timerActionLabel(timer, text) }}</Primitive.ActionTrigger>
          <button type="button" class="rd-button" @click="resetReadyTimer(timer)">{{ text.resetLabel }}</button>
        </Primitive.Control>
      </Primitive.Context>
    </Primitive.Root>
  </div>
</template>
