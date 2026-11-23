<script lang="ts">
  import { useSignature } from '@destyler-ui/svelte/signature';
  import { createSignatureSession, signatureClearButton, signatureDrawing, signatureHint, signatureLabels,
    signatureStatus, signatureSurface, type SignatureProps } from '../Signature';

  const props: SignatureProps = $props();
  const id = $props.id();
  const hint = `${id}-hint`;
  const session = createSignatureSession();
  let paths = $state.raw<string[]>([]);
  const api = useSignature(() => ({ id, drawing: signatureDrawing, disabled: props.disabled, translations: signatureLabels(props.label),
    onDrawEnd: ({ paths: actual }) => session.done(actual, next => { paths = next; props.onPathsChange?.([...next]); }) }));
  $effect(() => { if (props.disabled) session.abort(api().clear); });
  const labelId = $derived(api().getLabelProps().id);
</script>

<div {...api().getRootProps()} class="rd-component rd-signature" role="group" aria-labelledby={labelId} aria-describedby={hint}>
  <span id={labelId} data-scope="signature" data-part="label">{props.label}</span>
  <p id={hint} class="rd-signature-hint">{signatureHint}</p>
  <div {...signatureSurface(api().getControlProps())} aria-hidden="true"
    onpointerdowncapture={event => session.down(event, props.disabled)}
    onpointerupcapture={event => session.up(event.pointerId)}
    onpointercancelcapture={event => session.abort(api().clear, event.pointerId)}
    onlostpointercapture={event => session.abort(api().clear, event.pointerId)}
    oncontextmenucapture={() => session.abort(api().clear)}>
    <span {...api().getGuideProps()}></span>
    <svg {...api().getSegmentProps()}>
      {#each paths as path}
        <path {...api().getSegmentPathProps({ path })}></path>
      {/each}
      {#if api().currentPath}
        <path {...api().getSegmentPathProps({ path: api().currentPath ?? '' })} data-draft=""></path>
      {/if}
    </svg>
  </div>
  <div class="rd-signature-actions">
    <p role="status">{signatureStatus(paths.length)}</p>
    <button {...signatureClearButton(api().getClearTriggerProps())} onclick={event => session.clear(api().clear, event.currentTarget)}>Clear</button>
  </div>
</div>
