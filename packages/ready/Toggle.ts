/** A button with a stable visible label and an on/off pressed state. */
export interface ToggleProps {
  label: string
  /** Parent-owned pressed state; omit for an uncontrolled toggle. */
  pressed?: boolean
  /** Initial pressed state of an uncontrolled toggle. */
  defaultPressed?: boolean
  disabled?: boolean
  onPressedChange?: (pressed: boolean) => void
}
