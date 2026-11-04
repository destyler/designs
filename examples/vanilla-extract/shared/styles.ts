import { classes, themes } from '@destyler/designs-vanilla-extract-poc'
import { recipes } from '../../shadcn/styles/recipes'
export type Engine = 'vanilla-extract' | 'tailwind'
export const overrides = { '--dy-primary': '#7c3aed', '--dy-primary-foreground': '#ffffff', '--dy-ring': '#a78bfa', '--dy-radius': '1rem' }
export function scopeClass(dark: boolean) { return `${themes[dark ? 'dark' : 'light']} ${dark ? 'dark' : ''}` }
export function styles(engine: Engine): typeof classes {
  if (engine === 'vanilla-extract') return classes
  return {
    switchRoot: 'fixture-switch-root', switchControl: recipes.switch,
    switchThumb: recipes['switch-thumb'], switchLabel: recipes.label,
    button: recipes.button, dialogBackdrop: recipes['dialog-overlay'], dialogPositioner: '',
    dialogContent: recipes['dialog-content'], dialogHeader: recipes['dialog-header'],
    dialogTitle: recipes['dialog-title'], dialogDescription: recipes['dialog-description'],
    dialogFooter: recipes['dialog-footer'], dialogClose: recipes['dialog-close'],
  }
}
