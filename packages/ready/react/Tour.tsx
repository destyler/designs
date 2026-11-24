import { useEffect, useRef, useState } from 'react';
import { useTour } from '@destyler-ui/react';
import { createTourSession, prepareTour, tourDialogProps, tourLabel, tourOptions, type TourProps } from '../Tour';

export function Tour(props: TourProps) {
  const [steps] = useState(() => prepareTour(props.steps));
  const [session] = useState(createTourSession);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => session.dispose, [session]);
  const api = useTour(tourOptions(steps, ({ status }) => session.status(status, props.onEnd)));
  const step = api.step ?? steps[0];
  const action = api.lastStep
    ? api.getActionTriggerProps({ action: { label: 'Finish', action: ({ dismiss }) => session.finish(dismiss) } })
    : api.getActionTriggerProps({ action: { label: 'Next', action: 'next' } });

  return (
    <div className="rd-component rd-tour">
      <button type="button" aria-haspopup="dialog" className="rd-tour-start" onClick={event => session.start(dialog.current, event.currentTarget, api.start)}>
        {tourLabel(props.label)}
      </button>
      <dialog {...tourDialogProps(api.getContentProps())} ref={dialog} onCancel={session.cancel} onClose={session.close}>
        <header className="rd-tour-head">
          <span {...api.getProgressTextProps()} role="status">{Math.max(1, api.stepIndex + 1)} of {api.totalSteps}</span>
          <button {...api.getCloseTriggerProps()}>Close</button>
        </header>
        <h2 {...api.getTitleProps()}>{step.title}</h2>
        <p {...api.getDescriptionProps()}>{step.description}</p>
        <div className="rd-tour-actions">
          <button {...api.getActionTriggerProps({ action: { label: 'Back', action: 'prev' } })}>Back</button>
          <button {...action}>{api.lastStep ? 'Finish' : 'Next'}</button>
        </div>
      </dialog>
    </div>
  );
}
