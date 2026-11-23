<script lang="ts">
  import { onDestroy } from 'svelte';
  import { useHoverCard } from '@destyler-ui/svelte/hover-card';
  import { createHoverCardIntent, hoverCardPart, hoverCardPositioning, hoverCardTiming,
    resolveHoverCard, type HoverCardProps } from '../HoverCard';

  const props: HoverCardProps = $props();
  const config = $derived(resolveHoverCard(props));
  const id = $props.id();
  const descriptionId = `${id}-description`;
  let open = $state(false);
  const intent = createHoverCardIntent(value => { open = value; });
  onDestroy(intent.dispose);
  const api = useHoverCard(() => ({ id, open, positioning: hoverCardPositioning, ...hoverCardTiming,
    onOpenChange: ({ open: next }) => { if (!next) intent.dismiss(); } }));
</script>

<span class="rd-component rd-hover-card">
  <a {...hoverCardPart(api().getTriggerProps())} href={config.href} aria-describedby={descriptionId}
    onpointerenter={event => intent.enter('trigger', event.pointerType)}
    onpointerleave={event => intent.leave('trigger', event.pointerType)}
    onfocus={intent.focus} onblur={intent.blur}
    onkeydown={event => { if (intent.escape(event.key, event.defaultPrevented, event.isComposing)) event.preventDefault(); }}>
    {config.label}
  </a>
  <span id={descriptionId} hidden>{config.title ? `${config.title}. ` : ''}{config.description}</span>
  <span {...api().getPositionerProps()}>
    <span {...hoverCardPart(api().getContentProps())} aria-hidden="true"
      onpointerenter={event => intent.enter('card', event.pointerType)}
      onpointerleave={event => intent.leave('card', event.pointerType)}>
      {#if config.title}<strong>{config.title}</strong>{/if}
      <span>{config.description}</span>
    </span>
  </span>
</span>
