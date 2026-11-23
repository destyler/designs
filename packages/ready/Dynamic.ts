import { validateAccessibleText } from './accessible-text';

export type DynamicProps = {
  /** Visible label for the tag input. */
  label: string;
  /** Initial tags; later changes do not change the current list. */
  defaultValue?: readonly string[];
  /** Maximum tag count. Defaults to 10. */
  maxTags?: number;
  /** Maximum length of a single tag, measured in UTF-16 code units. Defaults to 48. */
  maxLength?: number;
  disabled?: boolean;
  /** When given, submits one JSON-encoded array under this name. */
  name?: string;
  onValueChange?: (value: readonly string[]) => void;
};

export function resolveDynamic({ label, defaultValue = [], maxTags = 10, maxLength = 48 }: DynamicProps) {
  validateAccessibleText(label, 'Dynamic', 'label');
  if (!Number.isSafeInteger(maxTags) || maxTags < 1) {
    throw new RangeError('Ready Dynamic: maxTags must be a positive integer.');
  }
  if (!Number.isSafeInteger(maxLength) || maxLength < 1 || maxLength > 2147483647) {
    throw new RangeError('Ready Dynamic: maxLength must be a positive integer that fits an HTML input.');
  }
  const isAllowed = (tag: string) => typeof tag === 'string' && tag !== '' && tag.length <= maxLength && !/[\r\n]/.test(tag);
  if (!Array.isArray(defaultValue) || defaultValue.length > maxTags) {
    throw new Error('Ready Dynamic: defaultValue must be an array within the tag limit.');
  }
  const initial = Array.from(defaultValue, value => typeof value === 'string' ? value.trim() : '');
  if (!initial.every(isAllowed) || new Set(initial).size !== initial.length) {
    throw new Error('Ready Dynamic: default tags must be distinct, single-line, nonempty text within maxLength.');
  }
  return {
    defaultValue: initial, maxTags, maxLength,
    validate: ({ inputValue, value }: { inputValue: string; value: string[] }) =>
      value.length < maxTags && isAllowed(inputValue) && !value.includes(inputValue),
  };
}

export const dynamicTranslations = {
  clearTriggerLabel: 'Clear all tags',
  deleteTagTriggerLabel: (value: string) => `Remove tag ${value}`,
  tagAdded: (value: string) => `Added tag ${value}.`,
  tagsPasted: (values: string[]) => `Pasted ${values.length} tags.`,
  tagEdited: (value: string) => `Editing tag ${value}.`,
  tagUpdated: (value: string) => `Updated tag ${value}.`,
  tagDeleted: (value: string) => `Removed tag ${value}.`,
  tagSelected: (value: string) => `Tag ${value} selected. Press Delete or Backspace to remove it.`,
};

export const dynamicHint = 'Enter to add a tag. With the field empty, use the arrow keys to select a tag, then Delete to remove it.';

export function addDynamicTag(api: {
  inputValue: string;
  count: number;
  addValue: (value: string) => void;
  clearInputValue: () => void;
  focus: () => void;
}, maxTags: number) {
  if (api.count < maxTags && api.inputValue) {
    api.addValue(api.inputValue);
    api.clearInputValue();
  }
  api.focus();
}
