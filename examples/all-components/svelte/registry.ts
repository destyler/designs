import ExampleAspectRatio from './aspect-ratio.svelte'
import ExampleAvatar from './avatar.svelte'
import ExampleBreadcrumbs from './breadcrumbs.svelte'
import ExampleCalendar from './calendar.svelte'
import ExampleCarousel from './carousel.svelte'
import ExampleCheckbox from './checkbox.svelte'
import ExampleClipboard from './clipboard.svelte'
import ExampleCollapse from './collapse.svelte'
import ExampleCollapsible from './collapsible.svelte'
import ExampleColorPicker from './color-picker.svelte'
import ExampleCombobox from './combobox.svelte'
import ExampleDialog from './dialog.svelte'
import ExampleDynamic from './dynamic.svelte'
import ExampleEdit from './edit.svelte'
import ExampleField from './field.svelte'
import ExampleFieldset from './fieldset.svelte'
import ExampleFileUpload from './file-upload.svelte'
import ExampleFloatingPanel from './floating-panel.svelte'
import ExampleHoverCard from './hover-card.svelte'
import ExampleLabel from './label.svelte'
import ExampleMenu from './menu.svelte'
import ExampleNavigationMenu from './navigation-menu.svelte'
import ExampleNumberInput from './number-input.svelte'
import ExampleOtpInput from './otp-input.svelte'
import ExamplePagination from './pagination.svelte'
import ExamplePopover from './popover.svelte'
import ExamplePresence from './presence.svelte'
import ExampleProgress from './progress.svelte'
import ExampleQrCode from './qr-code.svelte'
import ExampleRadio from './radio.svelte'
import ExampleScrollArea from './scroll-area.svelte'
import ExampleSelect from './select.svelte'
import ExampleSeparator from './separator.svelte'
import ExampleSignature from './signature.svelte'
import ExampleSlider from './slider.svelte'
import ExampleSplitter from './splitter.svelte'
import ExampleSteps from './steps.svelte'
import ExampleSwitch from './switch.svelte'
import ExampleTabs from './tabs.svelte'
import ExampleTimer from './timer.svelte'
import ExampleToast from './toast.svelte'
import ExampleToggle from './toggle.svelte'
import ExampleToggleGroup from './toggle-group.svelte'
import ExampleTooltip from './tooltip.svelte'
import ExampleTour from './tour.svelte'
import ExampleTree from './tree.svelte'

export const examples = {
  'aspect-ratio': ExampleAspectRatio,
  'avatar': ExampleAvatar,
  'breadcrumbs': ExampleBreadcrumbs,
  'calendar': ExampleCalendar,
  'carousel': ExampleCarousel,
  'checkbox': ExampleCheckbox,
  'clipboard': ExampleClipboard,
  'collapse': ExampleCollapse,
  'collapsible': ExampleCollapsible,
  'color-picker': ExampleColorPicker,
  'combobox': ExampleCombobox,
  'dialog': ExampleDialog,
  'dynamic': ExampleDynamic,
  'edit': ExampleEdit,
  'field': ExampleField,
  'fieldset': ExampleFieldset,
  'file-upload': ExampleFileUpload,
  'floating-panel': ExampleFloatingPanel,
  'hover-card': ExampleHoverCard,
  'label': ExampleLabel,
  'menu': ExampleMenu,
  'navigation-menu': ExampleNavigationMenu,
  'number-input': ExampleNumberInput,
  'otp-input': ExampleOtpInput,
  'pagination': ExamplePagination,
  'popover': ExamplePopover,
  'presence': ExamplePresence,
  'progress': ExampleProgress,
  'qr-code': ExampleQrCode,
  'radio': ExampleRadio,
  'scroll-area': ExampleScrollArea,
  'select': ExampleSelect,
  'separator': ExampleSeparator,
  'signature': ExampleSignature,
  'slider': ExampleSlider,
  'splitter': ExampleSplitter,
  'steps': ExampleSteps,
  'switch': ExampleSwitch,
  'tabs': ExampleTabs,
  'timer': ExampleTimer,
  'toast': ExampleToast,
  'toggle': ExampleToggle,
  'toggle-group': ExampleToggleGroup,
  'tooltip': ExampleTooltip,
  'tour': ExampleTour,
  'tree': ExampleTree,
} as const
export type Family = keyof typeof examples
