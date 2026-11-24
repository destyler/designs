<script lang="ts">
  import { untrack } from 'svelte'
  import { Steps as Primitive } from '@destyler-ui/svelte/steps'
  import { prepareSteps, validateStepsIndex, type StepsProps } from '../Steps'

  let { label, items, step, defaultStep, previousLabel, nextLabel, finishLabel, completedLabel, onStepChange }: StepsProps = $props()
  const model = $derived(prepareSteps({ label, items, previousLabel, nextLabel, finishLabel, completedLabel }))
  const count = $derived(model.items.length)
  let local = $state(untrack(() => validateStepsIndex(defaultStep ?? 0, count, 'defaultStep')))
  const current = $derived(step === undefined ? Math.min(local, count) : validateStepsIndex(step, count, 'step'))
  function change({ step: next }: { step: number }) {
    if (step === undefined) local = next
    onStepChange?.(next)
  }
</script>

<nav class="rd-component" aria-label={model.label}>
  <Primitive.Root step={current} {count} onStepChange={change}>
    <ol class="rd-steps-list" aria-label={model.label}>
      {#each model.items as item, index (item.id)}
        <li aria-current={index === current ? 'step' : undefined}
          data-current={index === current ? '' : undefined} data-complete={index < current ? '' : undefined}>
          {item.label}
          {#if item.description?.trim()}<p class="rd-description">{item.description}</p>{/if}
        </li>
      {/each}
    </ol>
    <div class="rd-steps-actions">
      <Primitive.PrevTrigger class="rd-button">{model.previousLabel}</Primitive.PrevTrigger>
      <Primitive.NextTrigger class="rd-button">{current >= count - 1 ? model.finishLabel : model.nextLabel}</Primitive.NextTrigger>
    </div>
    <div role="status">{current === count ? model.completedLabel : ''}</div>
  </Primitive.Root>
</nav>
