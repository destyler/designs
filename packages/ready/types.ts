export type Option = { value: string; label: string; disabled?: boolean };
export type CheckboxProps = { label: string; checked?: boolean; disabled?: boolean; name?: string; onCheckedChange?: (checked: boolean) => void };
export type SelectProps = { label: string; options: Option[]; value?: string; placeholder?: string; disabled?: boolean; name?: string; onValueChange?: (value: string) => void };
export type DialogProps = { trigger: string; title: string; description?: string; open?: boolean; onOpenChange?: (open: boolean) => void };
