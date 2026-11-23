/** Required visible naming text. Validate without changing the supplied text. */
export function validateAccessibleText(value: string, component: string, prop: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Ready ${component}: ${prop} must contain non-whitespace text.`);
  }
  return value;
}
