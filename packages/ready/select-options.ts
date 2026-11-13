import type { Option } from './types';

/** Empty string is reserved for clearing a Select, including in disabled options. */
export function validateSelectOptions<T extends Option>(options: T[]): T[] {
  if (options.some(option => option.value === '')) {
    throw new Error('Ready Select: option.value must not be empty; empty string is reserved for no selection.');
  }
  return options;
}
