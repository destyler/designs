<script setup lang="ts">
import { computed, ref } from 'vue'
import { Steps as Primitive } from '@destyler-ui/vue'
import { prepareSteps, validateStepsIndex, type StepsProps } from '../Steps'

const props = defineProps<Omit<StepsProps, 'onStepChange'>>()
const emit = defineEmits<{ 'update:step': [step: number]; stepChange: [step: number] }>()
const model = computed(() => prepareSteps(props))
const count = computed(() => model.value.items.length)
const local = ref(validateStepsIndex(props.defaultStep ?? 0, count.value, 'defaultStep'))
const step = computed(() => props.step === undefined ? Math.min(local.value, count.value) : validateStepsIndex(props.step, count.value, 'step'))
function change({ step: next }: { step: number }) {
  if (props.step === undefined) local.value = next
  emit('update:step', next)
  emit('stepChange', next)
}
</script>

<template>
  <nav class="rd-component" :aria-label="model.label">
    <Primitive.Root :model-value="step" :count="count" @step-change="change">
      <ol class="rd-steps-list" :aria-label="model.label">
        <li v-for="(item, index) in model.items" :key="item.id" :aria-current="index === step ? 'step' : undefined"
          :data-current="index === step ? '' : undefined" :data-complete="index < step ? '' : undefined">
          {{ item.label }}
          <p v-if="item.description?.trim()" class="rd-description">{{ item.description }}</p>
        </li>
      </ol>
      <div class="rd-steps-actions">
        <Primitive.PrevTrigger class="rd-button">{{ model.previousLabel }}</Primitive.PrevTrigger>
        <Primitive.NextTrigger class="rd-button">{{ step >= count - 1 ? model.finishLabel : model.nextLabel }}</Primitive.NextTrigger>
      </div>
      <div role="status">{{ step === count ? model.completedLabel : '' }}</div>
    </Primitive.Root>
  </nav>
</template>
