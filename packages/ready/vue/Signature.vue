<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useSignature } from '@destyler-ui/vue';
import { createSignatureSession, signatureClearButton, signatureDrawing, signatureHint, signatureLabels,
  signatureStatus, signatureSurface, type SignatureProps } from '../Signature';

defineOptions({ inheritAttrs: false });
const props = defineProps<Omit<SignatureProps, 'onPathsChange'>>();
const emit = defineEmits<{ pathsChange: [paths: readonly string[]] }>();
const session = createSignatureSession();
const paths = ref<string[]>([]);
const hint = useId();
const translations = computed(() => signatureLabels(props.label));
const api = useSignature({ drawing: signatureDrawing, get disabled() { return props.disabled; },
  get translations() { return translations.value; },
  onDrawEnd: ({ paths: actual }) => session.done(actual, next => { paths.value = next; emit('pathsChange', [...next]); }) });
watch(() => props.disabled, value => { if (value) session.abort(api.value.clear); });
const labelId = computed(() => api.value.getLabelProps().id);
function onDown(event: PointerEvent) {
  if (event.currentTarget instanceof HTMLDivElement) {
    session.down(event as PointerEvent & { currentTarget: HTMLDivElement }, props.disabled);
  }
}
</script>

<template>
  <div v-bind="api.getRootProps()" class="rd-component rd-signature" role="group" :aria-labelledby="labelId" :aria-describedby="hint">
    <span :id="labelId" data-scope="signature" data-part="label">{{ label }}</span>
    <p :id="hint" class="rd-signature-hint">{{ signatureHint }}</p>
    <div v-bind="signatureSurface(api.getControlProps())" aria-hidden="true"
      @pointerdown.capture="onDown" @pointerup.capture="session.up($event.pointerId)"
      @pointercancel.capture="session.abort(api.clear, $event.pointerId)"
      @lostpointercapture="session.abort(api.clear, $event.pointerId)" @contextmenu.capture="session.abort(api.clear)">
      <span v-bind="api.getGuideProps()" />
      <svg v-bind="api.getSegmentProps()">
        <path v-for="(path, index) in paths" :key="index" v-bind="api.getSegmentPathProps({ path })" />
        <path v-if="api.currentPath" v-bind="api.getSegmentPathProps({ path: api.currentPath })" data-draft="" />
      </svg>
    </div>
    <div class="rd-signature-actions">
      <p role="status">{{ signatureStatus(paths.length) }}</p>
      <button v-bind="signatureClearButton(api.getClearTriggerProps())" @click="session.clear(api.clear, $event.currentTarget as HTMLButtonElement)">Clear</button>
    </div>
  </div>
</template>
