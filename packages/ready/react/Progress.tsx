import { useId } from 'react';
import { Progress as Primitive } from '@destyler-ui/react';
import { resolveProgress, type ProgressProps } from '../Progress';

export function Progress(props: ProgressProps) {
  const labelId = useId();
  const { label, value, min, max } = resolveProgress(props);
  return <Primitive.Root className="rd-component" value={value} min={min} max={max}>
    <span className="rd-progress-label" id={labelId}>{label}</span>
    <Primitive.Track aria-labelledby={labelId}>
      <Primitive.Range />
    </Primitive.Track>
  </Primitive.Root>;
}
