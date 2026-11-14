# Choosing and customizing a Ready theme

Import the stylesheet once in your Vite application's entry module:

```ts
import '@destyler/ready-prototype/theme.css'
```

Every Ready component needs a themed ancestor. The same markup works with any
framework (use `className` instead of `class` in React):

```html
<section data-rd-theme="default">
  <!-- Checkbox, Select and Dialog components -->
</section>
<section data-rd-theme="midnight">
  <!-- A second independent component tree -->
</section>
```

`default` is light, rounded and sans-serif. `midnight` uses a dark green palette,
serif type, sharper corners, larger spacing and a hard shadow. Change the
ancestor's `data-rd-theme` attribute to switch style without replacing components
or resetting their state. This does not automatically persist a preference or
follow the OS color-scheme setting; that choice belongs to the application.

## Custom style without a plugin

Keep a built-in theme as a complete base, then override only the semantic tokens
you need. Import your application stylesheet **after** `theme.css`:

```css
/* app.css */
[data-rd-theme="default"].brand-theme {
  --rd-accent: #6d28d9;
  --rd-on-accent: #ffffff;
  --rd-radius: 4px;
  --rd-font: ui-sans-serif, system-ui, sans-serif;
}
```

```html
<section data-rd-theme="default" class="brand-theme">
  <!-- Ready components -->
</section>
```

The selector includes the theme attribute and a class so it is more specific than
the built-in theme selector. An inline custom property on the themed ancestor
also overrides the base. Do not change `--rd-accent` alone without checking its
contrast against `--rd-on-accent`, surfaces and focus-ring backgrounds. These
examples are customization recipes, not a color-contrast certification.

## Minimal token contract

| Token | Purpose |
| --- | --- |
| `--rd-bg` | Theme container background |
| `--rd-surface` | Control and overlay surface |
| `--rd-text` | Main text |
| `--rd-muted` | Secondary text |
| `--rd-border` | Control and overlay borders |
| `--rd-accent` | Selected controls, action buttons and focus rings |
| `--rd-on-accent` | Text/icons on the accent color |
| `--rd-radius` | Base corner radius (CSS length) |
| `--rd-control-height` | Minimum trigger/button height (CSS length) |
| `--rd-space` | Component spacing (CSS length) |
| `--rd-shadow` | Overlay shadow |
| `--rd-font` | Font-family list; no font download is included |
| `--rd-backdrop` | Dialog backdrop color |
| `--rd-overlay-z` | Dialog backdrop stacking level (number, no units) |

A nested element with its own `data-rd-theme` starts a new complete theme. It
resets the tokens instead of inheriting a parent's custom palette. Apply a custom
class or overrides to that nested scope as well if you want the same brand there.
Ordinary descendants without a theme attribute inherit the nearest scope.

## Overlay boundary and verification limits

Select and Dialog overlays stay inline under their component's themed ancestor,
so local tokens and later theme-attribute changes reach them. There is no body
portal or theme bridge. Avoid clipped, transformed or isolated stacking ancestors;
raising `--rd-overlay-z` cannot escape clipping or another stacking context.
General nested modal stacks are not part of this pilot's supported contract.

Two themes, token definitions, DOM scope retention and generated CSS are checked
by automated tests. Actual rendering, contrast, zoom, keyboard focus visibility,
mobile layout and assistive-technology acceptance still need browser testing.

## Built-in contrast checks

The built-in palettes target at least 4.5:1 for normal text and 3:1 for meaningful
enabled-control boundaries and focus colors against both `--rd-bg` and
`--rd-surface`. `--rd-on-accent` is for `--rd-accent`, not general surfaces.
Disabled controls retain lower-opacity styling and are not tested against enabled
contrast thresholds. Error messages use ordinary text plus ARIA, not color alone.

These are static palette checks, not a guarantee about custom tokens, host
backgrounds, rendered focus visibility or complete accessibility. See the
[ratios, regression and limits](https://github.com/destyler/designs/blob/feat/ready-components-pilot/docs/ready-theme-contrast.md).


## Long Select lists

Select content has a 20rem maximum height, further limited by the positioning
primitive's `--available-height` when it is available. Before measurement, the
20rem fallback still bounds the list. Vertical overflow is scrollable and
overscroll is contained. This adds no theme-specific code or new semantic token.
It does not implement virtualization: all supplied options are still rendered.

Static CSS checks verify this constraint, and four-framework simulated keyboard
tests exercise long lists. Neither proves actual scrolling, pointer/touch use,
clipping or viewport fit. In particular, inline Select content inside Dialog's
scrollable content can still be clipped; the nested Escape tests are not evidence
that this layout is production-ready. A portal/theme bridge would require a
separate design and remains outside this slice.
