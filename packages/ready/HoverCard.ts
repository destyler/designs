import { validateAccessibleText } from './accessible-text';

export type HoverCardProps = {
  /** Visible native link label. */
  label: string;
  /** Native destination: a relative URL, fragment, HTTP(S), mailto or tel. */
  href: string;
  /** Optional heading for the supplemental preview. */
  title?: string;
  /** Supplemental text only. Keep essential information at the destination. */
  description: string;
};

export const hoverCardTiming = { openDelay: 240, closeDelay: 300 } as const;
export const hoverCardPositioning = { placement: 'bottom-start', gutter: 0 } as const;

export function resolveHoverCard({ label, href, title, description }: HoverCardProps) {
  validateAccessibleText(label, 'HoverCard', 'label');
  validateAccessibleText(description, 'HoverCard', 'description');
  if (title !== undefined) validateAccessibleText(title, 'HoverCard', 'title');
  if (typeof href !== 'string' || !href.trim()) {
    throw new Error('Ready HoverCard: href must be nonempty.');
  }
  const scheme = href.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase();
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) {
    throw new Error('Ready HoverCard: unsupported href scheme.');
  }
  return { label, href, title, description };
}

/** Keep the UI primitive's anatomy/positioning, replacing only its input event ownership. */
export function hoverCardPart<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !/^on/i.test(key))) as T;
}

type PointerSide = 'trigger' | 'card';

/** v0.0.5's pointer state can close over a still-focused trigger. Track the two inputs independently. */
export function createHoverCardIntent(onChange: (open: boolean) => void) {
  let focused = false;
  let trigger = false;
  let card = false;
  let dismissed = false;
  let open = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }
  function update(next: boolean) {
    cancel();
    if (open !== next) {
      open = next;
      onChange(open);
    }
  }
  function setSide(side: PointerSide, value: boolean) {
    if (side === 'trigger') trigger = value;
    else card = value;
  }
  function releaseDismissal() {
    if (!trigger && !card && !focused) dismissed = false;
  }
  function dismiss() {
    // Closing hides the card, so a pending card pointerleave cannot be relied on.
    card = false;
    dismissed = focused || trigger;
    update(false);
  }
  return {
    enter(side: PointerSide, pointerType: string) {
      if (pointerType === 'touch') return;
      setSide(side, true);
      cancel();
      if (dismissed || open) return;
      timer = setTimeout(() => update(true), hoverCardTiming.openDelay);
    },
    leave(side: PointerSide, pointerType: string) {
      if (pointerType === 'touch') return;
      setSide(side, false);
      releaseDismissal();
      if (focused || trigger || card) return;
      cancel();
      if (open) timer = setTimeout(() => update(false), hoverCardTiming.closeDelay);
    },
    focus() {
      focused = true;
      if (!dismissed) update(true);
    },
    blur() {
      focused = false;
      releaseDismissal();
      if (!trigger && !card) update(false);
    },
    dismiss,
    escape(key: string, alreadyHandled: boolean, composing: boolean) {
      if (key !== 'Escape' || alreadyHandled || composing || (!open && timer === undefined)) return false;
      dismiss();
      return true;
    },
    dispose: cancel,
  };
}
