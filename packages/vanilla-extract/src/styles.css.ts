/**
 * Default Switch/Dialog design, derived from the pinned shadcn New York source.
 * MIT upstream attribution: ../../vendor/shadcn/LICENSE (copied into dist).
 * Only Destyler's DOM states change; no behavior or framework code lives here.
 */
import { createGlobalThemeContract, createTheme, globalLayer, keyframes, style, type StyleRule } from '@vanilla-extract/css'

const layer = globalLayer('destyler')
export const vars = createGlobalThemeContract({
  background: 'dy-background', foreground: 'dy-foreground',
  primary: 'dy-primary', primaryForeground: 'dy-primary-foreground',
  input: 'dy-input', ring: 'dy-ring', border: 'dy-border',
  mutedForeground: 'dy-muted-foreground', radius: 'dy-radius',
})
const internal = createGlobalThemeContract({
  track: 'dy-switch-track', thumbOn: 'dy-switch-thumb-on', thumbOff: 'dy-switch-thumb-off',
})
const light = createTheme(vars, {
  '@layer': layer,
  background: 'oklch(1 0 0)', foreground: 'oklch(0.141 0.005 285.823)',
  primary: 'oklch(0.21 0.006 285.885)', primaryForeground: 'oklch(0.985 0 0)',
  input: 'oklch(0.92 0.004 286.32)', ring: 'oklch(0.705 0.015 286.067)',
  border: 'oklch(0.92 0.004 286.32)', mutedForeground: 'oklch(0.552 0.016 285.938)', radius: '0.625rem',
})
const dark = createTheme(vars, {
  '@layer': layer,
  background: 'oklch(0.141 0.005 285.823)', foreground: 'oklch(0.985 0 0)',
  primary: 'oklch(0.92 0.004 286.32)', primaryForeground: 'oklch(0.21 0.006 285.885)',
  input: 'oklch(1 0 0 / 15%)', ring: 'oklch(0.552 0.016 285.938)',
  border: 'oklch(1 0 0 / 10%)', mutedForeground: 'oklch(0.705 0.015 286.067)', radius: '0.625rem',
})
// These private derived tokens follow overrides on the *same scope*. Copy the
// explicit token overrides to portal roots, as shown in both consumer adapters.
const lightDerived = style({ '@layer': { [layer]: { vars: {
  [internal.track]: vars.input, [internal.thumbOn]: vars.background, [internal.thumbOff]: vars.background,
} } } })
const darkDerived = style({ '@layer': { [layer]: { vars: {
  [internal.track]: `color-mix(in oklab, ${vars.input} 80%, transparent)`,
  [internal.thumbOn]: vars.primaryForeground, [internal.thumbOff]: vars.foreground,
} } } })
export const themes = { light: `${light} ${lightDerived}`, dark: `${dark} ${darkDerived}` } as const
const s = (rule: StyleRule, name: string) => style({ '@layer': { [layer]: rule } }, name)
const timing = '150ms cubic-bezier(0.4, 0, 0.2, 1)'
const focus = { borderColor: vars.ring, boxShadow: `0 0 0 3px color-mix(in oklab, ${vars.ring} 50%, transparent), 0 1px 2px 0 rgb(0 0 0 / 0.05)` }
const noMotion = { '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0s', animationDuration: '0.01ms' } } }
const switchRoot = s({ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: vars.foreground, boxSizing: 'border-box' }, 'switchRoot')
const switchControl = s({
  display: 'inline-flex', flexShrink: 0, alignItems: 'center', boxSizing: 'border-box',
  width: '2rem', height: '1.15rem', border: '1px solid transparent', borderRadius: '9999px',
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', outline: 'none',
  transition: `all ${timing}`, backgroundColor: internal.track, ...noMotion,
  selectors: {
    '&[data-state="checked"]': { backgroundColor: vars.primary },
    '&[data-state="unchecked"]': { backgroundColor: internal.track },
    '&[data-size="sm"]': { width: '1.5rem', height: '0.875rem' },
    '&[data-focus-visible]': focus,
    '&[data-disabled]': { cursor: 'not-allowed', opacity: 0.5 },
  },
}, 'switchControl')
const switchThumb = s({
  display: 'block', pointerEvents: 'none', boxSizing: 'border-box', width: '1rem', height: '1rem',
  borderRadius: '9999px', backgroundColor: internal.thumbOff, translate: '0 0',
  transition: `translate ${timing}`, ...noMotion,
  selectors: {
    [`${switchControl}[data-size="sm"] &`]: { width: '0.75rem', height: '0.75rem' },
    '&[data-state="checked"]': { translate: 'calc(100% - 2px) 0', backgroundColor: internal.thumbOn },
    '&[data-state="unchecked"]': { translate: '0 0', backgroundColor: internal.thumbOff },
  },
}, 'switchThumb')
const switchLabel = s({
  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', lineHeight: 1,
  fontWeight: 500, userSelect: 'none', color: vars.foreground,
  selectors: { '&[data-disabled]': { cursor: 'not-allowed', opacity: 0.5 } },
}, 'switchLabel')
const button = s({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: '0.5rem',
  boxSizing: 'border-box', border: '0 solid transparent', borderRadius: `calc(${vars.radius} * 0.8)`,
  fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '1.25rem',
  whiteSpace: 'nowrap', height: '2.25rem', padding: '0.5rem 1rem', cursor: 'pointer',
  background: vars.primary, color: vars.primaryForeground, outline: 'none', transition: `all ${timing}`, ...noMotion,
  selectors: {
    '&:hover': { backgroundColor: `color-mix(in oklab, ${vars.primary} 90%, transparent)` },
    '&:focus-visible': focus,
    '&:disabled': { pointerEvents: 'none', opacity: 0.5 },
  },
}, 'button')
const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const fadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } })
const enter = keyframes({ from: { opacity: 0, scale: '0.95' }, to: { opacity: 1, scale: '1' } })
const exit = keyframes({ from: { opacity: 1, scale: '1' }, to: { opacity: 0, scale: '0.95' } })
const dialogBackdrop = s({
  position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgb(0 0 0 / 0.5)',
  animationDuration: '150ms', animationTimingFunction: 'ease', ...noMotion,
  selectors: {
    '&[hidden]': { display: 'none' },
    '&[data-state="open"]': { animationName: fadeIn },
    '&[data-state="closed"]': { animationName: fadeOut },
  },
}, 'dialogBackdrop')
// The primitive positioner is deliberately inert; content matches the fixed
// centered upstream design instead of taking over focus/scroll/portal behavior.
const dialogPositioner = s({ selectors: { '&[hidden]': { display: 'none' } } }, 'dialogPositioner')
const dialogContent = s({
  position: 'fixed', top: '50%', left: '50%', zIndex: 50,
  display: 'grid', boxSizing: 'border-box', width: '100%', maxWidth: 'calc(100% - 2rem)',
  translate: '-50% -50%', gap: '1rem', borderRadius: vars.radius,
  border: `1px solid ${vars.border}`, backgroundColor: vars.background, color: vars.foreground,
  padding: '1.5rem', margin: 0, fontFamily: 'inherit',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  outline: 'none', animationDuration: '200ms', animationTimingFunction: 'ease',
  selectors: {
    '&[hidden]': { display: 'none' },
    '&[data-state="open"]': { animationName: enter },
    '&[data-state="closed"]': { animationName: exit },
  },
  '@media': { '(min-width: 640px)': { maxWidth: '32rem' }, '(prefers-reduced-motion: reduce)': { animationDuration: '0.01ms' } },
}, 'dialogContent')
const dialogHeader = s({ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', '@media': { '(min-width: 640px)': { textAlign: 'left' } } }, 'dialogHeader')
const dialogFooter = s({ display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem', '@media': { '(min-width: 640px)': { flexDirection: 'row', justifyContent: 'flex-end' } } }, 'dialogFooter')
const dialogTitle = s({ margin: 0, fontSize: '1.125rem', lineHeight: 1, fontWeight: 600 }, 'dialogTitle')
const dialogDescription = s({ margin: 0, fontSize: '0.875rem', lineHeight: '1.25rem', color: vars.mutedForeground }, 'dialogDescription')
const dialogClose = s({
  position: 'absolute', top: '1rem', right: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, width: '1rem', height: '1rem', border: 0, borderRadius: '0.125rem', background: 'transparent',
  color: 'inherit', opacity: 0.7, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', lineHeight: 1,
  transition: `opacity ${timing}`, ...noMotion,
  selectors: {
    '&:hover': { opacity: 1 },
    '&:focus': { outline: '2px solid transparent', outlineOffset: 2, boxShadow: `0 0 0 2px ${vars.background}, 0 0 0 4px ${vars.ring}` },
    '&:disabled': { pointerEvents: 'none' },
  },
}, 'dialogClose')
export const classes = { switchRoot, switchControl, switchThumb, switchLabel, button, dialogBackdrop, dialogPositioner, dialogContent, dialogHeader, dialogTitle, dialogDescription, dialogFooter, dialogClose } as const
