import { forms } from './forms.ts'
import { interactive } from './interactive.ts'
import { layout } from './layout.ts'
import type { Demo } from './demo-types.ts'

// The public Ready export inventory is checked separately against this catalog.
export const catalog = { ...forms, ...interactive, ...layout } satisfies Record<string, Demo>
