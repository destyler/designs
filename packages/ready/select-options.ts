import type { Option } from './types';

/** Values are nonempty, unique keys, including for disabled options. */
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
  return options;
}
