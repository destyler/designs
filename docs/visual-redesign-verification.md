# Dark component lab visual redesign · 2026-11-04

## Scope

This pass changes presentation only. It preserves the Astro document, full-width original shadcn reference above four simultaneous framework cards, independent Preview/Code and theme controls, exact selected-component source files, iframe lifecycle, browser history, and actual components. Five previews now start in dark mode; their light modes remain available independently and together. The style package architecture is outside this pass.

## Reference actually inspected

The exact requested page, https://ui.productdevbook.com/docs?framework=vue&component=accordion, was opened in cloud Chrome. The visible page, accessibility tree, screenshot, and computed DOM styles were inspected. At a 1180 × 757 viewport it uses a near-black `rgb(11, 11, 12)` background, warm-white text, a 600-weight 82.6px Geist heading with approximately -4.54px tracking, compact uppercase monospace labels, fine rectangular boundaries, framework-colored dots, and a dotted canvas. Its public stylesheet is `/assets/index-CiPC4q3b.css`. No logo, branded asset, component code, or full stylesheet was copied.

## Applied visual system

- Near-black document, subtly differentiated panel/editor surfaces, warm-white titles, muted but legible secondary text, and a restrained pale-green accent.
- Large, tightly tracked component headings and small indexed section labels instead of ordinary document-page typography.
- Hard-edged cards, thin borders, a persistent desktop library rail, compact horizontal mobile component navigation, original Destyler mark, and framework-colored dots that accompany text labels rather than replace them.
- Coordinated dark previews with the same dotted *canvas* in all five frames. Component tokens and vendored shadcn source are unchanged.
- A dark IDE source inspector with individual filename tabs, contrasting syntax colors, contained horizontal scrolling, copy/source actions, and readable line numbers.
- Hover feedback and one brief entrance transition. Reduced-motion users receive no shell transitions or animations; focus-visible indicators and forced-colors active tabs are explicit.
- Dialog canvases are taller than Switch canvases so the actual modal has room; no demonstration layouts were introduced.

## Verification completed

- `npm test`: 35 source/contract tests passed.
- `npm run check`: JavaScript syntax passed.
- `npm run check:types`: React/TypeScript, Vue, Solid and Svelte passed, with zero Svelte warnings.
- `ASTRO_TELEMETRY_DISABLED=1 npm run check:astro`: 14 files, zero errors, warnings or hints.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: Astro, preserved fixtures and four consumers passed.
- `npm run test:dom`: legacy production smoke and current five-panel static Astro output passed.
- `npm run test:showcase:dom`: actual production island hydration passed, including default dark URLs, five independent themes, all exact source bytes/copy actions, keyboard tabs, preserved iframe nodes, and repeated component navigation. Zero errors or warnings. Iframe readiness is simulated in this suite.

- `npm run test:showcase:rendering`: all eight actual framework SSR/hydration cases passed.
- `npm run test:designs:panels`: all eight preserved Panel SSR/hydration cases passed.

## Current visual-verification limit

Cloud Chrome successfully inspected the public reference. It cannot connect to the build container's loopback preview: navigation to `http://127.0.0.1:4321/` returned `net::ERR_CONNECTION_REFUSED` even while Astro's server was running. These are separate network environments. No local Chromium security restriction was changed or bypassed, and no user computer was used.

The redesigned output has **not yet received browser screenshot acceptance**. Await a public deployment URL after integration, then inspect desktop, narrow layouts, actual iframes, mixed Preview/Code states and Dialog behavior before declaring visual acceptance. DOM checks are not screenshots or browser-native focus-trap verification. The browser regression script has default-dark expectations updated but is not reported as executed by this pass.
