import { createEffect, createMemo, createSignal, createUniqueId, For, Show } from 'solid-js';
import { useSignature } from '@destyler-ui/solid/signature';
import { createSignatureSession, signatureClearButton, signatureDrawing, signatureHint, signatureLabels,
  signatureStatus, signatureSurface, type SignatureProps } from '../Signature';

export function Signature(props: SignatureProps) {
  const session = createSignatureSession();
  const [paths, setPaths] = createSignal<string[]>([]);
  const hint = `rd-signature-hint-${createUniqueId()}`;
  const translations = createMemo(() => signatureLabels(props.label));
  const api = useSignature({ drawing: signatureDrawing, get disabled() { return props.disabled; },
    get translations() { return translations(); },
    onDrawEnd: ({ paths: actual }) => session.done(actual, next => { setPaths(next); props.onPathsChange?.([...next]); }) });
  createEffect(() => { if (props.disabled) session.abort(api().clear); });
  const labelId = () => api().getLabelProps().id;

  return (
    <div {...api().getRootProps()} class="rd-component rd-signature" role="group" aria-labelledby={labelId()} aria-describedby={hint}>
      <span id={labelId()} data-scope="signature" data-part="label">{props.label}</span>
      <p id={hint} class="rd-signature-hint">{signatureHint}</p>
      <div {...signatureSurface(api().getControlProps())} aria-hidden="true"
        on:pointerdown={{ capture: true, handleEvent(event) { session.down(event, props.disabled); } }}
        on:pointerup={{ capture: true, handleEvent(event) { session.up(event.pointerId); } }}
        on:pointercancel={{ capture: true, handleEvent(event) { session.abort(api().clear, event.pointerId); } }}
        on:lostpointercapture={event => session.abort(api().clear, event.pointerId)}
        on:contextmenu={{ capture: true, handleEvent() { session.abort(api().clear); } }}>
        <span {...api().getGuideProps()} />
        <svg {...api().getSegmentProps()}>
          <For each={paths()}>{path => <path {...api().getSegmentPathProps({ path })} />}</For>
          <Show when={api().currentPath}>{path => <path {...api().getSegmentPathProps({ path: path() })} data-draft="" />}</Show>
        </svg>
      </div>
      <div class="rd-signature-actions">
        <p role="status">{signatureStatus(paths().length)}</p>
        <button {...signatureClearButton(api().getClearTriggerProps())} onClick={event => session.clear(api().clear, event.currentTarget)}>Clear</button>
      </div>
    </div>
  );
}
