/** Select option values must be unique and nonempty. Exact duplicates and "" are rejected; whitespace is preserved. Option labels must contain non-whitespace text. */
export type Option = { value: string; label: string; disabled?: boolean };
export type CheckboxProps = { label: string; description?: string; checked?: boolean; disabled?: boolean; required?: boolean; error?: string; name?: string; onCheckedChange?: (checked: boolean) => void };
export type SelectProps = { label: string; description?: string; options: Option[]; value?: string; placeholder?: string; emptyMessage?: string; disabled?: boolean; required?: boolean; error?: string; name?: string; onValueChange?: (value: string) => void };
export type DialogProps = { trigger: string; title: string; description?: string; closeLabel?: string; open?: boolean; onOpenChange?: (open: boolean) => void };
/** Use checked for controlled state, or defaultChecked for an initial form reset baseline. */
export type SwitchProps = {
  label: string
  description?: string
  error?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  value?: string
  onCheckedChange?: (checked: boolean) => void
}
export type { ProgressProps } from './Progress'
export type { CollapsibleProps } from './Collapsible'
export type { PaginationProps } from './Pagination'
export type { TabsItem, TabsProps } from './Tabs.types'
export type { ToggleProps } from './Toggle'
export type { SeparatorProps } from './Separator'
export type { FieldsetProps } from './Fieldset'
export type { AvatarProps } from './Avatar'
export type { AspectRatioProps } from './AspectRatio'
export type { BreadcrumbsItem, BreadcrumbsProps } from './Breadcrumbs'
export type { RadioGroupItem, RadioGroupProps } from './RadioGroup'
export type { FieldProps } from './Field'
export type { LabelProps } from './Label'
export type { NumberInputProps } from './NumberInput'
export type { SliderProps } from './Slider'
export type { FileUploadProps } from './FileUpload'
export type { OTPInputProps } from './OTPInput'
export type { ScrollAreaProps } from './ScrollArea'
export type { CollapseItem, CollapseProps } from './Collapse'
export type { SplitterProps } from './Splitter'
export type { StepsItem, StepsProps } from './Steps'
export type { CarouselItem, CarouselProps } from './Carousel'
