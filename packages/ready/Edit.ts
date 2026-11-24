import { validateAccessibleText } from './accessible-text';

export type EditProps = {
  /** Visible label and the accessible name of the text input. */
  label: string;
  /** Initial single-line text, when not yet edited. */
  defaultValue?: string;
  /** Text shown for an empty preview and as the input hint. */
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  /** Called on explicit Save or non-composing Enter, including an unchanged save. */
  onValueCommit?: (value: string) => void;
};

export function editOptions({ label, defaultValue = '', placeholder, maxLength }: EditProps) {
  validateAccessibleText(label, 'Edit', 'label');
  if (typeof defaultValue !== 'string' || /[\r\n]/.test(defaultValue)) {
    throw new Error('Ready Edit: defaultValue must be single-line text.');
  }
  if (placeholder !== undefined) validateAccessibleText(placeholder, 'Edit', 'placeholder');
  if (maxLength !== undefined && (!Number.isSafeInteger(maxLength) || maxLength < 1 || maxLength > 2147483647)) {
    throw new RangeError('Ready Edit: maxLength must be a positive integer that fits an HTML input.');
  }
  if (maxLength !== undefined && defaultValue.length > maxLength) {
    throw new RangeError('Ready Edit: defaultValue exceeds maxLength.');
  }
  return {
    defaultValue, maxLength, placeholder: { edit: placeholder ?? '', preview: placeholder ?? 'Not set' },
    activationMode: 'dblclick' as const,
    submitMode: 'none' as const,
    selectOnFocus: false,
    translations: { input: label, edit: `Edit ${label}`, submit: `Save ${label}`, cancel: `Cancel editing ${label}` },
  };
}

/** Keep the UI anatomy, but make the preview passive and handle native input events consistently. */
export function editPresentation<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    !/^on/i.test(key) && !['tabindex', 'aria-label', 'aria-disabled', 'aria-readonly', 'children'].includes(key.toLowerCase()))) as T;
}

export function editNativeHandlers<T extends object>(props: T): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !/^on/i.test(key))) as T;
}

type EditOutsideEvent = Pick<Event, 'currentTarget' | 'preventDefault'> & { detail: { originalEvent: Event } };

export function isComposingEditInput(event: Event) {
  return 'isComposing' in event && event.isComposing === true;
}

type InputApi = {
  editing: boolean;
  setValue: (value: string) => void;
  submit: () => void;
  cancel: () => void;
};
type InputKey = Pick<KeyboardEvent, 'key' | 'keyCode' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey' | 'defaultPrevented' | 'preventDefault'>;

export function createEditInput() {
  let composing = false;
  let outsideRoot: Element | null = null;
  function sync(api: InputApi, input: HTMLInputElement) {
    if (api.editing && !input.disabled) api.setValue(input.value);
  }
  return {
    reset({ edit }: { edit: boolean }) {
      composing = false;
      if (edit) outsideRoot = null;
    },
    interactOutside(event: EditOutsideEvent) {
      if (!(event.currentTarget instanceof Element)) return;
      const root = event.currentTarget.closest('.rd-edit');
      if (!root) return;
      const target = event.detail.originalEvent.target;
      if (target instanceof Node && root.contains(target)) {
        event.preventDefault();
        return;
      }
      outsideRoot = root;
    },
    finalFocus() {
      if (!outsideRoot) return null;
      // The UI-controlled edit transition can lose the initiating outside
      // event. Preserve browser focus (rather than stealing it back to Edit)
      // when its deferred restore hook runs after the pointer/focus action.
      const root = outsideRoot;
      outsideRoot = null;
      const active = root.ownerDocument.activeElement;
      return active instanceof HTMLElement && !root.contains(active) ? active : root.ownerDocument.body;
    },
    startComposition() { composing = true; },
    endComposition(api: InputApi, input: HTMLInputElement) {
      composing = false;
      sync(api, input);
    },
    input(api: InputApi, input: HTMLInputElement, nativeComposing: boolean) {
      if (!composing && !nativeComposing) sync(api, input);
    },
    save(api: InputApi) {
      if (api.editing && !composing) api.submit();
    },
    key(api: InputApi, input: HTMLInputElement, event: InputKey, nativeComposing: boolean) {
      if (!api.editing || input.disabled || event.defaultPrevented || composing || nativeComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        api.cancel();
      } else if (event.key === 'Enter') {
        // This inline editor never implicitly submits a surrounding form.
        event.preventDefault();
        if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
        sync(api, input);
        api.submit();
      }
    },
  };
}
