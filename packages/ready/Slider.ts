import { validateAccessibleText } from './accessible-text';

export type SliderProps = {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Controlled position, with updates requested via the native framework event. */
  value?: number;
  /** Initial position when uncontrolled. Defaults to min. */
  defaultValue?: number;
  /** Optional native form submission name. */
  name?: string;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
};

export function resolveSlider({ label, value, defaultValue, min = 0, max = 100, step = 1 }: SliderProps) {
  validateAccessibleText(label, 'Slider', 'label');
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(max - min))
    throw new RangeError('Ready Slider: min and max must define a finite increasing range.');
  if (!Number.isFinite(step) || step <= 0 || step > max - min || min + step <= min || max - step >= max)
    throw new RangeError('Ready Slider: step must advance through the range and cannot exceed its size.');
  for (const [field, position] of [['value', value], ['defaultValue', defaultValue]] as const) {
    if (position !== undefined && (!Number.isFinite(position) || position < min || position > max))
      throw new RangeError(`Ready Slider: ${field} must be finite and within the range.`);
  }
  return { label, min, max, step, value: value === undefined ? undefined : [value], defaultValue: [defaultValue ?? min] };
}
