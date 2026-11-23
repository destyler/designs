import { createMemo } from 'solid-js';
import { useEdit } from '@destyler-ui/solid/edit';
import { createEditInput, editNativeHandlers, editOptions, editPresentation, type EditProps } from '../Edit';

export function Edit(props: EditProps) {
  const input = createEditInput();
  const options = createMemo(() => editOptions(props));
  const api = useEdit({
    get defaultValue() { return options().defaultValue; },
    get maxLength() { return options().maxLength; },
    get placeholder() { return options().placeholder; },
    get translations() { return options().translations; },
    get disabled() { return props.disabled; },
    activationMode: 'dblclick', submitMode: 'none', selectOnFocus: false,
    onEditChange: input.reset, onInteractOutside: input.interactOutside, finalFocusEl: input.finalFocus, onValueCommit: ({ value }) => props.onValueCommit?.(value),
  });

  return (
    <div {...api().getRootProps()} class="rd-component rd-edit">
      <label {...api().getLabelProps()}>{props.label}</label>
      <div {...api().getAreaProps()}>
        <span {...editPresentation(api().getPreviewProps())}>{api().valueText}</span>
        <input {...editNativeHandlers(api().getInputProps())} type="text"
          onInput={event => input.input(api(), event.currentTarget, event.isComposing)}
          onCompositionStart={input.startComposition}
          onCompositionEnd={event => input.endComposition(api(), event.currentTarget)}
          onKeyDown={event => input.key(api(), event.currentTarget, event, event.isComposing)} />
      </div>
      <div {...api().getControlProps()}>
        <button {...api().getEditTriggerProps()}>Edit</button>
        <button {...editNativeHandlers(api().getSubmitTriggerProps())} onClick={() => input.save(api())}>Save</button>
        <button {...api().getCancelTriggerProps()}>Cancel</button>
      </div>
    </div>
  );
}
