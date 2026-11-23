import { useState } from 'react';
import { useEdit } from '@destyler-ui/react';
import { createEditInput, editNativeHandlers, editOptions, editPresentation, isComposingEditInput, type EditProps } from '../Edit';

export function Edit(props: EditProps) {
  const [input] = useState(createEditInput);
  const api = useEdit({ ...editOptions(props), disabled: props.disabled, onEditChange: input.reset,
    onInteractOutside: input.interactOutside, finalFocusEl: input.finalFocus, onValueCommit: ({ value }) => props.onValueCommit?.(value) });
  const inputProps = api.getInputProps();

  return (
    <div {...api.getRootProps()} className="rd-component rd-edit">
      <label {...api.getLabelProps()}>{props.label}</label>
      <div {...api.getAreaProps()}>
        <span {...editPresentation(api.getPreviewProps())}>{api.valueText}</span>
        <input {...editNativeHandlers(inputProps)} type="text"
          onInput={event => input.input(api, event.currentTarget, isComposingEditInput(event.nativeEvent))}
          onCompositionStart={input.startComposition}
          onCompositionEnd={event => input.endComposition(api, event.currentTarget)}
          onKeyDown={event => input.key(api, event.currentTarget, event, event.nativeEvent.isComposing)} />
      </div>
      <div {...api.getControlProps()}>
        <button {...api.getEditTriggerProps()}>Edit</button>
        <button {...editNativeHandlers(api.getSubmitTriggerProps())} onClick={() => input.save(api)}>Save</button>
        <button {...api.getCancelTriggerProps()}>Cancel</button>
      </div>
    </div>
  );
}
