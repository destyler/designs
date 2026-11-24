<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useTour } from '@destyler-ui/vue';
import { createTourSession, prepareTour, tourDialogProps, tourLabel, tourOptions, type TourOutcome, type TourProps } from '../Tour';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<TourProps, 'onEnd'>>();
const emit = defineEmits<{ end: [outcome: TourOutcome] }>();
const steps = prepareTour(props.steps);
const session = createTourSession();
const dialog = ref<HTMLDialogElement>();
onBeforeUnmount(session.dispose);
const api = useTour(tourOptions(steps, ({ status }) => session.status(status, outcome => emit('end', outcome))));
const step = computed(() => api.value.step ?? steps[0]);
const action = computed(() => api.value.lastStep
  ? api.value.getActionTriggerProps({ action: { label: 'Finish', action: ({ dismiss }) => session.finish(dismiss) } })
  : api.value.getActionTriggerProps({ action: { label: 'Next', action: 'next' } }));
function start(event: MouseEvent) {
  session.start(dialog.value, event.currentTarget as HTMLButtonElement, api.value.start);
}
</script>

<template>
  <div class="rd-component rd-tour">
    <button type="button" aria-haspopup="dialog" class="rd-tour-start" @click="start">{{ tourLabel(label) }}</button>
    <dialog v-bind="tourDialogProps(api.getContentProps())" ref="dialog" @cancel="session.cancel" @close="session.close">
      <header class="rd-tour-head">
        <span v-bind="api.getProgressTextProps()" role="status">{{ Math.max(1, api.stepIndex + 1) }} of {{ api.totalSteps }}</span>
        <button v-bind="api.getCloseTriggerProps()">Close</button>
      </header>
      <h2 v-bind="api.getTitleProps()">{{ step.title }}</h2>
      <p v-bind="api.getDescriptionProps()">{{ step.description }}</p>
      <div class="rd-tour-actions">
        <button v-bind="api.getActionTriggerProps({ action: { label: 'Back', action: 'prev' } })">Back</button>
        <button v-bind="action">{{ api.lastStep ? 'Finish' : 'Next' }}</button>
      </div>
    </dialog>
  </div>
</template>
