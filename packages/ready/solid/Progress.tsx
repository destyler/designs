import { createMemo, createUniqueId } from 'solid-js';
import { Progress as Primitive } from '@destyler-ui/solid';
import { resolveProgress, type ProgressProps } from '../Progress';

export function Progress(props: ProgressProps) {
  const labelId = createUniqueId();
  const resolved = createMemo(() => resolveProgress(props));
  return <Primitive.Root class="rd-component" value={resolved().value} min={resolved().min} max={resolved().max}>
    <span class="rd-progress-label" id={labelId}>{resolved().label}</span>
    <Primitive.Track aria-labelledby={labelId}>
      <Primitive.Range />
    </Primitive.Track>
  </Primitive.Root>;
}
