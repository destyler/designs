import type { FileUploadProps } from '../../packages/ready/FileUpload'
import type { FloatingPanelProps } from '../../packages/ready/FloatingPanel'
import type { HoverCardProps } from '../../packages/ready/HoverCard'
import type { LabelProps } from '../../packages/ready/Label'
import type { MenuProps } from '../../packages/ready/Menu'
import type { NavigationMenuProps } from '../../packages/ready/NavigationMenu'
import type { NumberInputProps } from '../../packages/ready/NumberInput'
import type { OTPInputProps } from '../../packages/ready/OTPInput'
import type { PaginationProps } from '../../packages/ready/Pagination'
import type { PopoverProps } from '../../packages/ready/Popover'
import type { ProgressProps } from '../../packages/ready/Progress'
import type { QRCodeProps } from '../../packages/ready/QRCode'
import type { RadioGroupProps } from '../../packages/ready/RadioGroup'
import type { ScrollAreaProps } from '../../packages/ready/ScrollArea'
import type { SeparatorProps } from '../../packages/ready/Separator'
import type { SelectProps } from '../../packages/ready/types'

export const interactive = {
  FileUpload: {
    args: { label: 'Supporting documents', accept: 'text/plain,.txt', maxFiles: 2, maxFileSize: 1024 * 1024 } satisfies FileUploadProps,
  },
  FloatingPanel: {
    args: { trigger: 'Open notes', title: 'Workspace notes' } satisfies FloatingPanelProps,
    child: 'Drag the handle, or focus it and use the arrow keys.',
    wide: true,
  },
  HoverCard: {
    args: {
      label: 'Studio workspace', href: '#studio-workspace', title: 'Studio workspace',
      description: 'A shared workspace for design reviews and draft assets.',
    } satisfies HoverCardProps,
  },
  Label: {
    args: { for: 'storybook-ready-label-input' } satisfies LabelProps,
    child: 'Display name',
  },
  Menu: {
    args: {
      trigger: 'Document actions',
      items: [
        { label: 'Rename', value: 'rename' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive', disabled: true },
      ],
    } satisfies MenuProps,
  },
  NavigationMenu: {
    args: {
      label: 'Workspace navigation',
      items: [
        { id: 'overview', label: 'Overview', href: '#overview', current: true },
        {
          id: 'resources', label: 'Resources',
          links: [
            { id: 'design', label: 'Design', href: '#design' },
            { id: 'engineering', label: 'Engineering', href: '#engineering' },
          ],
        },
      ],
    } satisfies NavigationMenuProps,
    wide: true,
  },
  NumberInput: {
    args: {
      label: 'Tickets', name: 'tickets', description: 'Choose between one and ten tickets.',
      defaultValue: '2', min: 1, max: 10, step: 1,
    } satisfies NumberInputProps,
  },
  OTPInput: {
    args: { label: 'Verification code', length: 6, defaultValue: ['1', '2'] } satisfies OTPInputProps,
  },
  Pagination: {
    args: { label: 'Search results pages', count: 84, pageSize: 10, defaultPage: 3 } satisfies PaginationProps,
    wide: true,
  },
  Popover: {
    args: {
      trigger: 'Notification settings', title: 'Notifications', description: 'Control what appears in your inbox.',
    } satisfies PopoverProps,
    child: 'You can dismiss this popover by pressing Escape.',
  },
  Progress: {
    args: { label: 'Preparing export', value: 64 } satisfies ProgressProps,
  },
  QRCode: {
    args: { label: 'A QR code containing the text Destyler Ready', value: 'Destyler Ready', size: 176 } satisfies QRCodeProps,
  },
  RadioGroup: {
    args: {
      label: 'Delivery schedule',
      items: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly (unavailable)', value: 'monthly', disabled: true },
      ],
      defaultValue: 'weekly',
    } satisfies RadioGroupProps,
  },
  ScrollArea: {
    args: { label: 'Release notes', maxHeight: 76 } satisfies ScrollAreaProps,
    child: [
      'The release adds a new theme and improves support for keyboard navigation.',
      'Forms now report invalid fields before submitting, so it is easier to correct an entry.',
      'Overlays restore focus to their triggers when dismissed.',
      'Use the arrow keys or a pointer to continue scrolling to the end of this preview.',
    ].join(' '),
  },
  Select: {
    args: {
      label: 'Workspace', name: 'workspace', placeholder: 'Choose a workspace',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Studio', value: 'studio' },
        { label: 'Enterprise (unavailable)', value: 'enterprise', disabled: true },
      ],
    } satisfies SelectProps,
  },
  Separator: {
    args: { orientation: 'horizontal' } satisfies SeparatorProps,
    wide: true,
  },
}
