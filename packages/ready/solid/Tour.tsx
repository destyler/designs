import { createMemo, onCleanup } from 'solid-js';
import { useTour } from '@destyler-ui/solid/tour';
import { createTourSession, prepareTour, tourDialogProps, tourLabel, tourOptions, type TourProps } from '../Tour';

export function Tour(props: TourProps) {
  const steps = prepareTour(props.steps);
  const session = createTourSession();
  let dialog: HTMLDialogElement | undefined;
  onCleanup(session.dispose);
  const api = useTour(tourOptions(steps, ({ status }) => session.status(status, props.onEnd)));
  const step = createMemo(() => api().step ?? steps[0]);
  const action = () => api().lastStep
    ? api().getActionTriggerProps({ action: { label: 'Finish', action: ({ dismiss }) => session.finish(dismiss) } })
    : api().getActionTriggerProps({ action: { label: 'Next', action: 'next' } });

  return (
    <div class="rd-component rd-tour">
      <button type="button" aria-haspopup="dialog" class="rd-tour-start" onClick={event => session.start(dialog, event.currentTarget, api().start)}>
        {tourLabel(props.label)}
      </button>
      <dialog {...tourDialogProps(api().getContentProps())} ref={dialog} on:cancel={session.cancel} on:close={session.close}>
        <header class="rd-tour-head">
          <span {...api().getProgressTextProps()} role="status">{Math.max(1, api().stepIndex + 1)} of {api().totalSteps}</span>
          <button {...api().getCloseTriggerProps()}>Close</button>
        </header>
        <h2 {...api().getTitleProps()}>{step().title}</h2>
        <p {...api().getDescriptionProps()}>{step().description}</p>
        <div class="rd-tour-actions">
          <button {...api().getActionTriggerProps({ action: { label: 'Back', action: 'prev' } })}>Back</button>
          <button {...action()}>{api().lastStep ? 'Finish' : 'Next'}</button>
        </div>
      </dialog>
    </div>
  );
}
