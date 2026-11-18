# Ready built-in theme contrast

This is a static sRGB color calculation for the shipped `default` and `midnight`
tokens, not rendered-browser or complete accessibility acceptance. Run:

```sh
node --test test/ready-theme-contrast.test.mjs
```

The test uses WCAG relative luminance and contrast ratio calculations. It checks
normal-sized text at 4.5:1 and meaningful enabled-control boundaries/focus colors
at 3:1, using unrounded ratios for pass/fail. The table rounds for readability.
Source-level regular-expression checks also verify the explicit CSS declarations
for accent buttons, checked Checkbox controls and highlighted Select items pair
`on-accent` text with `accent` backgrounds. They do not evaluate the CSS cascade,
computed styles, whether `:focus-visible` matches, or clipping/occlusion.

| Foreground / background | Default | Midnight |
| --- | ---: | ---: |
| text / bg | 15.55 | 16.12 |
| text / surface | 16.27 | 12.88 |
| muted / bg | 6.01 | 10.08 |
| muted / surface | 6.29 | 8.06 |
| border / bg | 3.48 | 4.58 |
| border / surface | 3.64 | 3.66 |
| accent / bg | 5.85 | 13.47 |
| accent / surface | 6.12 | 10.76 |
| on-accent / accent | 6.12 | 12.23 |

## Defect and correction

The previous default border `#c3ccda` had only 1.55:1 against the theme background
and 1.62:1 against the surface. The unchecked Checkbox depends on that boundary
for identification. It is now `#7b8799`. The previous midnight border `#4a7261`
passed against `bg` (3.22:1) but not `surface` (2.57:1), relevant when controls are
inside a surface such as a Dialog. It is now `#648b78`. No token names, component
APIs, geometry, or other theme colors changed. Not every decorative border is
independently required to meet 3:1; these targets protect meaningful boundaries.

## State interpretation

- Error text uses `--rd-text`, not color alone: a supplied message and ARIA
  association carry its meaning. Its nominal text contrast is covered above;
  this does not judge message usefulness or screen-reader announcements.
- Focus outlines use `--rd-accent` with a 3px outline and 3px offset; Checkbox
  forwards native input focus indication to its visible control. The palette
  contrast against `bg` and `surface` passes. Geometry in rendered layouts,
  clipping, occlusion, keyboard navigation and actual focus visibility remain
  untested by this calculation.
- Checked Checkbox and highlighted Select items use `on-accent` on `accent`.
  `on-accent` is not a general text color for `bg` or `surface`.
- Inactive Checkbox/Select controls use opacity 0.5; disabled options use 0.4.
  Inactive controls are exempt from the enabled text/non-text contrast thresholds.
  The test reports nominal alpha-composited ratios separately without passing or
  failing those states against enabled thresholds. For example, default disabled
  option text is approximately 2.45:1 against surface, not a normal text pass.
  This exemption does not apply to enabled explanatory text.

## Limits

The calculations assume opaque built-in backgrounds and the current CSS token
wiring. They do not cover custom themes, host CSS overrides, images, arbitrary
ancestor backgrounds, forced-colors/high-contrast modes, actual font rendering,
zoom, touch target size, focus trapping or assistive technology. Translucent
backdrops and shadows are not used as evidence that a control boundary passes.
Changing an application theme requires rechecking its own combinations. Passing
these checks must not be presented as WCAG conformance or real-browser acceptance.
