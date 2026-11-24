import { useEffect, useId, useState } from 'react';
import { useHoverCard } from '@destyler-ui/react';
import { createHoverCardIntent, hoverCardPart, hoverCardPositioning, hoverCardTiming,
  resolveHoverCard, type HoverCardProps } from '../HoverCard';

export function HoverCard(props: HoverCardProps) {
  const config = resolveHoverCard(props);
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [intent] = useState(() => createHoverCardIntent(setOpen));
  useEffect(() => intent.dispose, [intent]);
  const api = useHoverCard({ open, positioning: hoverCardPositioning, ...hoverCardTiming,
    onOpenChange: ({ open: next }) => { if (!next) intent.dismiss(); } });

  return (
    <span className="rd-component rd-hover-card">
      <a {...hoverCardPart(api.getTriggerProps())} href={config.href} aria-describedby={descriptionId}
        onPointerEnter={event => intent.enter('trigger', event.pointerType)}
        onPointerLeave={event => intent.leave('trigger', event.pointerType)}
        onFocus={intent.focus} onBlur={intent.blur}
        onKeyDown={event => { if (intent.escape(event.key, event.defaultPrevented, event.nativeEvent.isComposing)) event.preventDefault(); }}>
        {config.label}
      </a>
      <span id={descriptionId} hidden>{config.title ? `${config.title}. ` : ''}{config.description}</span>
      <span {...api.getPositionerProps()}>
        <span {...hoverCardPart(api.getContentProps())} aria-hidden="true"
          onPointerEnter={event => intent.enter('card', event.pointerType)}
          onPointerLeave={event => intent.leave('card', event.pointerType)}>
          {config.title && <strong>{config.title}</strong>}
          <span>{config.description}</span>
        </span>
      </span>
    </span>
  );
}
