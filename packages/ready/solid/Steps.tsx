import { createMemo, createSignal, For, Show } from 'solid-js'
import { Steps as Primitive } from '@destyler-ui/solid/steps'
import { prepareSteps, validateStepsIndex, type StepsProps } from '../Steps'

export function Steps(props: StepsProps) {
  const model = createMemo(() => prepareSteps(props))
  const count = () => model().items.length
  const [local, setLocal] = createSignal(validateStepsIndex(props.defaultStep ?? 0, count(), 'defaultStep'))
  const step = () => props.step === undefined ? Math.min(local(), count()) : validateStepsIndex(props.step, count(), 'step')
  return <nav class="rd-component" aria-label={model().label}>
    <Primitive.Root step={step()} count={count()} onStepChange={({ step: next }) => {
      if (props.step === undefined) setLocal(next)
      props.onStepChange?.(next)
    }}>
      <ol class="rd-steps-list" aria-label={model().label}>
        <For each={model().items}>{(item, index) => <li aria-current={index() === step() ? 'step' : undefined}
          data-current={index() === step() ? '' : undefined} data-complete={index() < step() ? '' : undefined}>
          {item.label}
          <Show when={item.description?.trim()}><p class="rd-description">{item.description}</p></Show>
        </li>}</For>
      </ol>
      <div class="rd-steps-actions">
        <Primitive.PrevTrigger class="rd-button">{model().previousLabel}</Primitive.PrevTrigger>
        <Primitive.NextTrigger class="rd-button">{step() >= count() - 1 ? model().finishLabel : model().nextLabel}</Primitive.NextTrigger>
      </div>
      <div role="status">{step() === count() ? model().completedLabel : ''}</div>
    </Primitive.Root>
  </nav>
}
