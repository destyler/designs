import { validateAccessibleText } from './accessible-text';

export type SignatureProps = {
  label: string;
  disabled?: boolean;
  /** The completed SVG path data in local drawing-surface pixels. No raster or form export. */
  onPathsChange?: (paths: readonly string[]) => void;
};

export const signatureDrawing = { size: 3, simulatePressure: true, fill: 'currentColor' };
export const signatureHint = 'Optional. Draw with a mouse, touch or pen. Use Clear to remove the drawing.';

export function signatureLabels(label: string) {
  validateAccessibleText(label, 'Signature', 'label');
  return { control: label, clearTrigger: `Clear ${label}` };
}

export function signatureStatus(count: number) {
  return count === 0 ? 'No drawing yet.' : `${count} ${count === 1 ? 'stroke' : 'strokes'} drawn.`;
}

export function signatureSurface<T extends object>(props: T): T {
  // The upstream focusable application role implies keyboard drawing. This
  // surface is pointer-only; announce the boundary on the named outer group.
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    !['tabindex', 'role', 'aria-roledescription', 'aria-label', 'aria-disabled'].includes(key.toLowerCase()))) as T;
}

export function signatureClearButton<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    !['onclick', 'hidden'].includes(key.toLowerCase()))) as T;
}

type PointerStart = Pick<PointerEvent,
  'button' | 'pointerId' | 'isPrimary' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'defaultPrevented' | 'preventDefault'>
  & { currentTarget: HTMLDivElement };

export function createSignatureSession() {
  let current: { id: number; surface: HTMLDivElement } | undefined;
  let action: 'draw' | 'clear' | 'abort' = 'draw';
  let completed: string[] = [];
  function release() {
    const pointer = current;
    current = undefined;
    if (pointer?.surface.hasPointerCapture(pointer.id)) pointer.surface.releasePointerCapture(pointer.id);
  }
  return {
    down(event: PointerStart, disabled: boolean | undefined) {
      if (event.defaultPrevented || disabled || current || !event.isPrimary || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        event.preventDefault(); // also prevents the underlying UI from starting a stroke
        return;
      }
      current = { id: event.pointerId, surface: event.currentTarget };
    },
    // Core releases capture on pointerup and commits on the document. Clear
    // the active pointer first so expected lostpointercapture is not a cancel.
    up(pointerId: number) {
      if (current?.id === pointerId) current = undefined;
    },
    abort(clear: () => void, pointerId?: number) {
      if (!current || (pointerId !== undefined && current.id !== pointerId)) return;
      action = 'abort';
      release();
      // v0.0.5 treats pointercancel as a normal pointerup, so leave drawing
      // synchronously with CLEAR, preserving the wrapper's completed strokes.
      clear();
    },
    clear(clear: () => void, button: HTMLButtonElement) {
      if (!current && completed.length === 0) return;
      const doc = button.ownerDocument;
      const surface = button.closest('.rd-signature')?.querySelector('[data-scope="signature"][data-part="control"]');
      const hadFocus = doc.activeElement === button;
      action = 'clear';
      release();
      clear();
      // Core unconditionally calls focus() on its drawing surface when
      // clearing. Only guard that one move; never override outside focus.
      if (hadFocus && surface) queueMicrotask(() => {
        if (button.isConnected && !button.disabled && doc.activeElement === surface) {
          button.focus({ preventScroll: true });
        }
      });
    },
    done(paths: string[], change: (paths: string[]) => void) {
      const result = action;
      action = 'draw';
      current = undefined;
      if (result === 'abort') return;
      if (result === 'clear') {
        if (!completed.length) return;
        completed = [];
      } else {
        const stroke = paths.at(-1);
        if (!stroke) return;
        completed = [...completed, stroke];
      }
      change([...completed]);
    },
  };
}
