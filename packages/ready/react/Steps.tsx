import { useState } from 'react'
import { Steps as Primitive } from '@destyler-ui/react'
import { prepareSteps, validateStepsIndex, type StepsProps } from '../Steps'

export function Steps(props: StepsProps) {
  const model = prepareSteps(props)
  const count = model.items.length
  const [local, setLocal] = useState(() => validateStepsIndex(props.defaultStep ?? 0, count, 'defaultStep'))
  const step = props.step === undefined ? Math.min(local, count) : validateStepsIndex(props.step, count, 'step')
  return <nav className="rd-component" aria-label={model.label}>
    <Primitive.Root step={step} count={count} onStepChange={({ step: next }) => {
      if (props.step === undefined) setLocal(next)
      props.onStepChange?.(next)
    }}>
      <ol className="rd-steps-list" aria-label={model.label}>
        {model.items.map((item, index) => <li key={item.id} aria-current={index === step ? 'step' : undefined}
          data-current={index === step ? '' : undefined} data-complete={index < step ? '' : undefined}>
          {item.label}
          {item.description?.trim() && <p className="rd-description">{item.description}</p>}
        </li>)}
      </ol>
      <div className="rd-steps-actions">
        <Primitive.PrevTrigger className="rd-button">{model.previousLabel}</Primitive.PrevTrigger>
        <Primitive.NextTrigger className="rd-button">{step >= count - 1 ? model.finishLabel : model.nextLabel}</Primitive.NextTrigger>
      </div>
      <div role="status">{step === count ? model.completedLabel : ''}</div>
    </Primitive.Root>
  </nav>
}
