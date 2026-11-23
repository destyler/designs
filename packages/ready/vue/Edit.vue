<script setup lang="ts">
import { computed } from 'vue';
import { useEdit } from '@destyler-ui/vue';
import { createEditInput, editNativeHandlers, editOptions, editPresentation, isComposingEditInput, type EditProps } from '../Edit';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<EditProps, 'onValueCommit'>>();
const emit = defineEmits<{ valueCommit: [value: string] }>();
const input = createEditInput();
const options = computed(() => editOptions(props));
const api = useEdit({
  get defaultValue() { return options.value.defaultValue; },
  get maxLength() { return options.value.maxLength; },
  get placeholder() { return options.value.placeholder; },
  get translations() { return options.value.translations; },
  get disabled() { return props.disabled; },
  activationMode: 'dblclick', submitMode: 'none', selectOnFocus: false,
  onEditChange: input.reset, onInteractOutside: input.interactOutside, finalFocusEl: input.finalFocus, onValueCommit: ({ value }) => emit('valueCommit', value),
});
function onInput(event: Event) {
  input.input(api.value, event.currentTarget as HTMLInputElement, isComposingEditInput(event));
}
function onCompositionEnd(event: CompositionEvent) {
  input.endComposition(api.value, event.currentTarget as HTMLInputElement);
}
function onKey(event: KeyboardEvent) {
  input.key(api.value, event.currentTarget as HTMLInputElement, event, event.isComposing);
}
</script>

<template>
  <div v-bind="api.getRootProps()" class="rd-component rd-edit">
    <label v-bind="api.getLabelProps()">{{ label }}</label>
    <div v-bind="api.getAreaProps()">
      <span v-bind="editPresentation(api.getPreviewProps())">{{ api.valueText }}</span>
      <input v-bind="editNativeHandlers(api.getInputProps())" type="text"
        @input="onInput" @compositionstart="input.startComposition" @compositionend="onCompositionEnd" @keydown="onKey" />
    </div>
    <div v-bind="api.getControlProps()">
      <button v-bind="api.getEditTriggerProps()">Edit</button>
      <button v-bind="editNativeHandlers(api.getSubmitTriggerProps())" @click="input.save(api)">Save</button>
      <button v-bind="api.getCancelTriggerProps()">Cancel</button>
    </div>
  </div>
</template>
