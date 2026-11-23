import { createMemo, createSignal, createUniqueId, onCleanup, Show } from 'solid-js';
import { useHoverCard } from '@destyler-ui/solid/hover-card';
import { createHoverCardIntent, hoverCardPart, hoverCardPositioning, hoverCardTiming,
  resolveHoverCard, type HoverCardProps } from '../HoverCard';

export function HoverCard(props: HoverCardProps) {
  const config = createMemo(() => resolveHoverCard(props));
  const descriptionId = `rd-hover-description-${createUniqueId()}`;
  const [open, setOpen] = createSignal(false);
  const intent = createHoverCardIntent(setOpen);
  onCleanup(intent.dispose);
  const api = useHoverCard({ get open() { return open(); }, positioning: hoverCardPositioning, ...hoverCardTiming,
    onOpenChange: ({ open: next }) => { if (!next) intent.dismiss(); } });

  return (
    <span class="rd-component rd-hover-card">
      <a {...hoverCardPart(api().getTriggerProps())} href={config().href} aria-describedby={descriptionId}
        on:pointerenter={event => intent.enter('trigger', event.pointerType)}
        on:pointerleave={event => intent.leave('trigger', event.pointerType)}
        onFocus={intent.focus} onBlur={intent.blur}
        onKeyDown={event => { if (intent.escape(event.key, event.defaultPrevented, event.isComposing)) event.preventDefault(); }}>
        {config().label}
      </a>
      <span id={descriptionId} hidden>{config().title ? `${config().title}. ` : ''}{config().description}</span>
      <span {...api().getPositionerProps()}>
        <span {...hoverCardPart(api().getContentProps())} aria-hidden="true"
          on:pointerenter={event => intent.enter('card', event.pointerType)}
          on:pointerleave={event => intent.leave('card', event.pointerType)}>
          <Show when={config().title}>{title => <strong>{title()}</strong>}</Show>
          <span>{config().description}</span>
        </span>
      </span>
    </span>
  );
}
