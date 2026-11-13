/** Select option values must be unique and nonempty. Exact duplicates and "" are rejected; whitespace is preserved. Option labels must contain non-whitespace text. */
export type Option = { value: string; label: string; disabled?: boolean };
export type CheckboxProps = { label: string; description?: string; checked?: boolean; disabled?: boolean; required?: boolean; error?: string; name?: string; onCheckedChange?: (checked: boolean) => void };
export type SelectProps = { label: string; description?: string; options: Option[]; value?: string; placeholder?: string; emptyMessage?: string; disabled?: boolean; required?: boolean; error?: string; name?: string; onValueChange?: (value: string) => void };
export type DialogProps = { trigger: string; title: string; description?: string; closeLabel?: string; open?: boolean; onOpenChange?: (open: boolean) => void };
