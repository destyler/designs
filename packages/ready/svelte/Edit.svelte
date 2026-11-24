<script lang="ts">
  import { useEdit } from '@destyler-ui/svelte/edit';
  import { createEditInput, editNativeHandlers, editOptions, editPresentation, isComposingEditInput, type EditProps } from '../Edit';

  const props: EditProps = $props();
  const id = $props.id();
  const input = createEditInput();
  const api = useEdit(() => ({ id, ...editOptions(props), disabled: props.disabled, onEditChange: input.reset,
    onInteractOutside: input.interactOutside, finalFocusEl: input.finalFocus, onValueCommit: ({ value }) => props.onValueCommit?.(value) }));
</script>

<div {...api().getRootProps()} class="rd-component rd-edit">
  <label {...api().getLabelProps()}>{props.label}</label>
  <div {...api().getAreaProps()}>
    <span {...editPresentation(api().getPreviewProps())}>{api().valueText}</span>
    <input {...editNativeHandlers(api().getInputProps())} type="text"
      oninput={event => input.input(api(), event.currentTarget, isComposingEditInput(event))}
      oncompositionstart={input.startComposition}
      oncompositionend={event => input.endComposition(api(), event.currentTarget)}
      onkeydown={event => input.key(api(), event.currentTarget, event, event.isComposing)} />
  </div>
  <div {...api().getControlProps()}>
    <button {...api().getEditTriggerProps()}>Edit</button>
    <button {...editNativeHandlers(api().getSubmitTriggerProps())} onclick={() => input.save(api())}>Save</button>
    <button {...api().getCancelTriggerProps()}>Cancel</button>
  </div>
</div>
