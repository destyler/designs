import { validateAccessibleText } from './accessible-text';

export type TourStep = { id: string; title: string; description: string };
export type TourOutcome = 'finished' | 'dismissed';
export type TourProps = {
  /** Visible name of the button that starts the tour. */
  label: string;
  /** A nonempty, fixed sequence of centered text-only steps. Read at mount. */
  steps: readonly TourStep[];
  /** Reports the exit once. Only the final Finish action reports 'finished'. */
  onEnd?: (outcome: TourOutcome) => void;
};

export function prepareTour(steps: readonly TourStep[]) {
  if (!Array.isArray(steps) || steps.length === 0) throw new Error('Ready Tour: at least one step is required.');
  const seen = new Set<string>();
  return Array.from(steps, step => {
    if (!step || typeof step.id !== 'string' || !step.id || /\s/.test(step.id) || seen.has(step.id)) {
      throw new Error('Ready Tour: step IDs must be unique, nonempty and contain no whitespace.');
    }
    seen.add(step.id);
    return {
      id: step.id, type: 'dialog' as const,
      title: validateAccessibleText(step.title, 'Tour', 'step title'),
      description: validateAccessibleText(step.description, 'Tour', 'step description'),
    };
  });
}

export function tourLabel(label: string) {
  return validateAccessibleText(label, 'Tour', 'label');
}

export function tourOptions(steps: ReturnType<typeof prepareTour>, onStatusChange: (details: { status: string }) => void) {
  const context = {
    steps, onStatusChange, keyboardNavigation: false, closeOnInteractOutside: false, closeOnEscape: false,
    preventInteraction: false, spotlightOffset: { x: 10, y: 10 }, spotlightRadius: 4,
    translations: { nextStep: 'Next', prevStep: 'Back', close: 'Close' },
  };
  // The UI 0.0.5 hook declares stepId required, but the machine initializes it
  // itself. Omit it so a framework context update cannot reset internal steps.
  return context as typeof context & { stepId: null };
}

type NativeDialogOmitted = 'hidden' | 'role' | 'tabindex' | 'tabIndex' | 'aria-live' | 'aria-atomic';
export function tourDialogProps<T extends object>(props: T): Omit<T, NativeDialogOmitted> {
  // State visibility belongs to the native dialog. Do not mark walkthrough
  // text as an urgent alert or set tabindex on a native dialog.
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    !['hidden', 'role', 'tabindex', 'aria-live', 'aria-atomic'].includes(key.toLowerCase()))) as Omit<T, NativeDialogOmitted>;
}

export function createTourSession() {
  let active: { dialog: HTMLDialogElement; launcher: HTMLButtonElement; finish: boolean } | undefined;
  function dismiss(dialog: HTMLDialogElement) {
    if (active?.dialog !== dialog) return;
    dialog.querySelector<HTMLButtonElement>('[data-scope="tour"][data-part="close-trigger"]')?.click();
  }
  return {
    start(dialog: HTMLDialogElement | undefined | null, launcher: HTMLButtonElement, start: () => void) {
      if (!dialog?.isConnected || dialog.open || active) return;
      dialog.showModal();
      active = { dialog, launcher, finish: false };
      start();
    },
    finish(dismissStep: () => void) {
      if (!active) return;
      active.finish = true;
      dismissStep();
    },
    status(status: string, onEnd: ((outcome: TourOutcome) => void) | undefined) {
      if (status !== 'dismissed' || !active) return;
      // The core also reports "completed" whenever the final step is
      // dismissed, even by Close. Ready reports completion only on Finish.
      const { dialog, launcher, finish } = active;
      active = undefined;
      if (dialog.open) dialog.close();
      if (launcher.isConnected && !launcher.disabled) launcher.focus({ preventScroll: true });
      // Let the primitive clear its last step before consumer code can re-open.
      if (onEnd) queueMicrotask(() => onEnd(finish ? 'finished' : 'dismissed'));
    },
    cancel(event: Pick<Event, 'currentTarget' | 'preventDefault'>) {
      event.preventDefault();
      dismiss(event.currentTarget as HTMLDialogElement);
    },
    close(event: Pick<Event, 'currentTarget'>) {
      const dialog = event.currentTarget as HTMLDialogElement;
      if (!dialog.open) dismiss(dialog);
    },
    dispose() {
      const dialog = active?.dialog;
      active = undefined;
      if (dialog?.open) dialog.close();
    },
  };
}
