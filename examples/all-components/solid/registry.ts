import type { Component } from 'solid-js'
import { Basic as Example0 } from './components/aspect-ratio/Basic'
import { Basic as Example1 } from './components/avatar/Basic'
import { Basic as Example2 } from './components/breadcrumbs/Basic'
import { Basic as Example3 } from './components/calendar/Basic'
import { Basic as Example4 } from './components/carousel/Basic'
import { Basic as Example5 } from './components/checkbox/Basic'
import { Basic as Example6 } from './components/clipboard/Basic'
import { Basic as Example7 } from './components/collapse/Basic'
import { Basic as Example8 } from './components/collapsible/Basic'
import { Basic as Example9 } from './components/color-picker/Basic'
import { Basic as Example10 } from './components/combobox/Basic'
import { Basic as Example11 } from './components/dialog/Basic'
import { Basic as Example12 } from './components/dynamic/Basic'
import { Basic as Example13 } from './components/edit/Basic'
import { Basic as Example14 } from './components/field/Basic'
import { Basic as Example15 } from './components/fieldset/Basic'
import { Basic as Example16 } from './components/file-upload/Basic'
import { Basic as Example17 } from './components/floating-panel/Basic'
import { Basic as Example18 } from './components/hover-card/Basic'
import { Basic as Example19 } from './components/label/Basic'
import { Basic as Example20 } from './components/menu/Basic'
import { Basic as Example21 } from './components/navigation-menu/Basic'
import { Basic as Example22 } from './components/number-input/Basic'
import { Basic as Example23 } from './components/otp-input/Basic'
import { Basic as Example24 } from './components/pagination/Basic'
import { Basic as Example25 } from './components/popover/Basic'
import { Basic as Example26 } from './components/presence/Basic'
import { Basic as Example27 } from './components/progress/Basic'
import { Basic as Example28 } from './components/qr-code/Basic'
import { Basic as Example29 } from './components/radio/Basic'
import { Basic as Example30 } from './components/scroll-area/Basic'
import { Basic as Example31 } from './components/select/Basic'
import { Basic as Example32 } from './components/separator/Basic'
import { Basic as Example33 } from './components/signature/Basic'
import { Basic as Example34 } from './components/slider/Basic'
import { Basic as Example35 } from './components/splitter/Basic'
import { Basic as Example36 } from './components/steps/Basic'
import { Basic as Example37 } from './components/switch/Basic'
import { Basic as Example38 } from './components/tabs/Basic'
import { Basic as Example39 } from './components/timer/Basic'
import { Basic as Example40 } from './components/toast/Basic'
import { Basic as Example41 } from './components/toggle/Basic'
import { Basic as Example42 } from './components/toggle-group/Basic'
import { Basic as Example43 } from './components/tooltip/Basic'
import { Basic as Example44 } from './components/tour/Basic'
import { Basic as Example45 } from './components/tree/Basic'

export const examples = {
  'aspect-ratio': Example0,
  'avatar': Example1,
  'breadcrumbs': Example2,
  'calendar': Example3,
  'carousel': Example4,
  'checkbox': Example5,
  'clipboard': Example6,
  'collapse': Example7,
  'collapsible': Example8,
  'color-picker': Example9,
  'combobox': Example10,
  'dialog': Example11,
  'dynamic': Example12,
  'edit': Example13,
  'field': Example14,
  'fieldset': Example15,
  'file-upload': Example16,
  'floating-panel': Example17,
  'hover-card': Example18,
  'label': Example19,
  'menu': Example20,
  'navigation-menu': Example21,
  'number-input': Example22,
  'otp-input': Example23,
  'pagination': Example24,
  'popover': Example25,
  'presence': Example26,
  'progress': Example27,
  'qr-code': Example28,
  'radio': Example29,
  'scroll-area': Example30,
  'select': Example31,
  'separator': Example32,
  'signature': Example33,
  'slider': Example34,
  'splitter': Example35,
  'steps': Example36,
  'switch': Example37,
  'tabs': Example38,
  'timer': Example39,
  'toast': Example40,
  'toggle': Example41,
  'toggle-group': Example42,
  'tooltip': Example43,
  'tour': Example44,
  'tree': Example45,
} satisfies Record<string, Component>

export type Family = keyof typeof examples
