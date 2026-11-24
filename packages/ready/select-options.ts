import type { Option } from './types';

/** Values are unique nonempty keys; every option also needs nonblank naming text. */
export function validateSelectOptions<T extends Option>(options: T[]): T[] {
  if (options.some(option => option.value === '')) {
    throw new Error('Ready Select: option.value must not be empty; empty string is reserved for no selection.');
  }
  const seen = new Set<string>();
  for (const option of options) {
    if (seen.has(option.value)) {
      throw new Error(`Ready Select: option.value must be unique; duplicate value ${JSON.stringify(option.value)}.`);
    }
    seen.add(option.value);
  }
  for (const option of options) {
    if (typeof option.label !== 'string' || option.label.trim() === '') {
      throw new Error('Ready Select: option.label must contain non-whitespace text.');
    }
  }
  return options;
}
