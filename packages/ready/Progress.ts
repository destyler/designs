import { validateAccessibleText } from './accessible-text';

export type ProgressProps = {
  label: string;
  /** Pass null for indeterminate progress. */
  value: number | null;
  min?: number;
  max?: number;
};

export function resolveProgress({ label, value, min = 0, max = 100 }: ProgressProps) {
  validateAccessibleText(label, 'Progress', 'label');
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(max - min))
    throw new RangeError('Ready Progress: min and max must define a finite increasing range.');
  if (value !== null && (!Number.isFinite(value) || value < min || value > max))
    throw new RangeError('Ready Progress: value must be null or a finite number within the range.');
  return { label, value, min, max };
}
