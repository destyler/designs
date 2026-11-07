import { type ComponentType } from 'react'
import coverage from '../shared/shadcn-coverage.json'
import AspectRatioExample from './demos/aspect-ratio'
import AvatarExample from './demos/avatar'
import BreadcrumbsExample from './demos/breadcrumbs'
import CalendarExample from './demos/calendar'
import CarouselExample from './demos/carousel'
import CheckboxExample from './demos/checkbox'
import ClipboardExample from './demos/clipboard'
import CollapseExample from './demos/collapse'
import CollapsibleExample from './demos/collapsible'
import ColorPickerExample from './demos/color-picker'
import ComboboxExample from './demos/combobox'
import DialogExample from './demos/dialog'
import DynamicExample from './demos/dynamic'
import EditExample from './demos/edit'
import FieldExample from './demos/field'
import FieldsetExample from './demos/fieldset'
import FileUploadExample from './demos/file-upload'
import FloatingPanelExample from './demos/floating-panel'
import HoverCardExample from './demos/hover-card'
import LabelExample from './demos/label'
import MenuExample from './demos/menu'
import NavigationMenuExample from './demos/navigation-menu'
import NumberInputExample from './demos/number-input'
import OtpInputExample from './demos/otp-input'
import PaginationExample from './demos/pagination'
import PopoverExample from './demos/popover'
import PresenceExample from './demos/presence'
import ProgressExample from './demos/progress'
import QrCodeExample from './demos/qr-code'
import RadioExample from './demos/radio'
import ScrollAreaExample from './demos/scroll-area'
import SelectExample from './demos/select'
import SeparatorExample from './demos/separator'
import SignatureExample from './demos/signature'
import SliderExample from './demos/slider'
import SplitterExample from './demos/splitter'
import StepsExample from './demos/steps'
import SwitchExample from './demos/switch'
import TabsExample from './demos/tabs'
import TimerExample from './demos/timer'
import ToastExample from './demos/toast'
import ToggleExample from './demos/toggle'
import ToggleGroupExample from './demos/toggle-group'
import TooltipExample from './demos/tooltip'
import TourExample from './demos/tour'
import TreeExample from './demos/tree'

export type Family = keyof typeof coverage

export const demos = {
  'aspect-ratio': AspectRatioExample,
  'avatar': AvatarExample,
  'breadcrumbs': BreadcrumbsExample,
  'calendar': CalendarExample,
  'carousel': CarouselExample,
  'checkbox': CheckboxExample,
  'clipboard': ClipboardExample,
  'collapse': CollapseExample,
  'collapsible': CollapsibleExample,
  'color-picker': ColorPickerExample,
  'combobox': ComboboxExample,
  'dialog': DialogExample,
  'dynamic': DynamicExample,
  'edit': EditExample,
  'field': FieldExample,
  'fieldset': FieldsetExample,
  'file-upload': FileUploadExample,
  'floating-panel': FloatingPanelExample,
  'hover-card': HoverCardExample,
  'label': LabelExample,
  'menu': MenuExample,
  'navigation-menu': NavigationMenuExample,
  'number-input': NumberInputExample,
  'otp-input': OtpInputExample,
  'pagination': PaginationExample,
  'popover': PopoverExample,
  'presence': PresenceExample,
  'progress': ProgressExample,
  'qr-code': QrCodeExample,
  'radio': RadioExample,
  'scroll-area': ScrollAreaExample,
  'select': SelectExample,
  'separator': SeparatorExample,
  'signature': SignatureExample,
  'slider': SliderExample,
  'splitter': SplitterExample,
  'steps': StepsExample,
  'switch': SwitchExample,
  'tabs': TabsExample,
  'timer': TimerExample,
  'toast': ToastExample,
  'toggle': ToggleExample,
  'toggle-group': ToggleGroupExample,
  'tooltip': TooltipExample,
  'tour': TourExample,
  'tree': TreeExample,
} satisfies Record<Family, ComponentType>

export const examples = {} as Record<Family, ComponentType>
for (const family of Object.keys(demos) as Family[]) {
  const Demo = demos[family]
  examples[family] = function ReferenceExample() {
    return <main className="reference-demo" data-reference-family={family} data-reference-state={coverage[family].status} aria-label={`${coverage[family].title} shadcn reference`}><Demo /></main>
  }
}

export { coverage }
