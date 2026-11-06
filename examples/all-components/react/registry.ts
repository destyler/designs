import type { ComponentType } from 'react'
import { Basic as AspectRatio } from './components/aspect-ratio/Basic'
import { Basic as Avatar } from './components/avatar/Basic'
import { Basic as Breadcrumbs } from './components/breadcrumbs/Basic'
import { Basic as Calendar } from './components/calendar/Basic'
import { Basic as Carousel } from './components/carousel/Basic'
import { Basic as Checkbox } from './components/checkbox/Basic'
import { Basic as Clipboard } from './components/clipboard/Basic'
import { Basic as Collapse } from './components/collapse/Basic'
import { Basic as Collapsible } from './components/collapsible/Basic'
import { Basic as ColorPicker } from './components/color-picker/Basic'
import { Basic as Combobox } from './components/combobox/Basic'
import { Basic as Dialog } from './components/dialog/Basic'
import { Basic as Dynamic } from './components/dynamic/Basic'
import { Basic as Edit } from './components/edit/Basic'
import { Basic as Field } from './components/field/Basic'
import { Basic as Fieldset } from './components/fieldset/Basic'
import { Basic as FileUpload } from './components/file-upload/Basic'
import { Basic as FloatingPanel } from './components/floating-panel/Basic'
import { Basic as HoverCard } from './components/hover-card/Basic'
import { Basic as Label } from './components/label/Basic'
import { Basic as Menu } from './components/menu/Basic'
import { Basic as NavigationMenu } from './components/navigation-menu/Basic'
import { Basic as NumberInput } from './components/number-input/Basic'
import { Basic as OtpInput } from './components/otp-input/Basic'
import { Basic as Pagination } from './components/pagination/Basic'
import { Basic as Popover } from './components/popover/Basic'
import { Basic as Presence } from './components/presence/Basic'
import { Basic as Progress } from './components/progress/Basic'
import { Basic as QrCode } from './components/qr-code/Basic'
import { Basic as Radio } from './components/radio/Basic'
import { Basic as ScrollArea } from './components/scroll-area/Basic'
import { Basic as Select } from './components/select/Basic'
import { Basic as Separator } from './components/separator/Basic'
import { Basic as Signature } from './components/signature/Basic'
import { Basic as Slider } from './components/slider/Basic'
import { Basic as Splitter } from './components/splitter/Basic'
import { Basic as Steps } from './components/steps/Basic'
import { Basic as Switch } from './components/switch/Basic'
import { Basic as Tabs } from './components/tabs/Basic'
import { Basic as Timer } from './components/timer/Basic'
import { Basic as Toast } from './components/toast/Basic'
import { Basic as Toggle } from './components/toggle/Basic'
import { Basic as ToggleGroup } from './components/toggle-group/Basic'
import { Basic as Tooltip } from './components/tooltip/Basic'
import { Basic as Tour } from './components/tour/Basic'
import { Basic as Tree } from './components/tree/Basic'

// Complete new reconstruction, sourced from the verified UI 0.0.4 release.
export const examples = {
  'aspect-ratio': AspectRatio,
  'avatar': Avatar,
  'breadcrumbs': Breadcrumbs,
  'calendar': Calendar,
  'carousel': Carousel,
  'checkbox': Checkbox,
  'clipboard': Clipboard,
  'collapse': Collapse,
  'collapsible': Collapsible,
  'color-picker': ColorPicker,
  'combobox': Combobox,
  'dialog': Dialog,
  'dynamic': Dynamic,
  'edit': Edit,
  'field': Field,
  'fieldset': Fieldset,
  'file-upload': FileUpload,
  'floating-panel': FloatingPanel,
  'hover-card': HoverCard,
  'label': Label,
  'menu': Menu,
  'navigation-menu': NavigationMenu,
  'number-input': NumberInput,
  'otp-input': OtpInput,
  'pagination': Pagination,
  'popover': Popover,
  'presence': Presence,
  'progress': Progress,
  'qr-code': QrCode,
  'radio': Radio,
  'scroll-area': ScrollArea,
  'select': Select,
  'separator': Separator,
  'signature': Signature,
  'slider': Slider,
  'splitter': Splitter,
  'steps': Steps,
  'switch': Switch,
  'tabs': Tabs,
  'timer': Timer,
  'toast': Toast,
  'toggle': Toggle,
  'toggle-group': ToggleGroup,
  'tooltip': Tooltip,
  'tour': Tour,
  'tree': Tree,
} satisfies Record<string, ComponentType>

export type Family = keyof typeof examples
