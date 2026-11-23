import { useEffect, useId, useState } from 'react';
import { useSignature } from '@destyler-ui/react';
import { createSignatureSession, signatureClearButton, signatureDrawing, signatureHint, signatureLabels,
  signatureStatus, signatureSurface, type SignatureProps } from '../Signature';

export function Signature(props: SignatureProps) {
  const [session] = useState(createSignatureSession);
  const [paths, setPaths] = useState<string[]>([]);
  const hint = useId();
  const api = useSignature({ drawing: signatureDrawing, disabled: props.disabled, translations: signatureLabels(props.label),
    onDrawEnd: ({ paths: actual }) => session.done(actual, next => { setPaths(next); props.onPathsChange?.([...next]); }) });
  useEffect(() => { if (props.disabled) session.abort(api.clear); }, [props.disabled, api.clear, session]);
  const labelId = api.getLabelProps().id;
  const clear = signatureClearButton(api.getClearTriggerProps());

  return (
    <div {...api.getRootProps()} className="rd-component rd-signature" role="group" aria-labelledby={labelId} aria-describedby={hint}>
      <span id={labelId} data-scope="signature" data-part="label">{props.label}</span>
      <p id={hint} className="rd-signature-hint">{signatureHint}</p>
      <div {...signatureSurface(api.getControlProps())} aria-hidden="true"
        onPointerDownCapture={event => session.down(event, props.disabled)}
        onPointerUpCapture={event => session.up(event.pointerId)}
        onPointerCancelCapture={event => session.abort(api.clear, event.pointerId)}
        onLostPointerCapture={event => session.abort(api.clear, event.pointerId)}
        onContextMenuCapture={() => session.abort(api.clear)}>
        <span {...api.getGuideProps()} />
        <svg {...api.getSegmentProps()}>
          {paths.map((path, index) => <path key={index} {...api.getSegmentPathProps({ path })} />)}
          {api.currentPath && <path {...api.getSegmentPathProps({ path: api.currentPath })} data-draft="" />}
        </svg>
      </div>
      <div className="rd-signature-actions">
        <p role="status">{signatureStatus(paths.length)}</p>
        <button {...clear} onClick={event => session.clear(api.clear, event.currentTarget)}>Clear</button>
      </div>
    </div>
  );
}
