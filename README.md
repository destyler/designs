# Scoped themes: cloud reimplementation

This is **newly written code**, not a copy or backup of the earlier Mac pilot.
Only the earlier task's written results informed the requirements. No Mac files,
screenshots, source archives, or browser sessions were accessed to build it.

## Interactive example

Run the four-card [theme playground](examples/scoped-themes/README.md) locally:

```sh
npm start
```

Open <http://127.0.0.1:4173/examples/scoped-themes/>. No package installation is
needed. The example compares Neutral/Ember in light/dark mode, independent theme
roots, local accent overrides, keyboard tabs, nested roots, an un-themed baseline,
and a detached body-level dialog with a live nine-token comparison. The shared
dialog disposes its previous theme binding before changing source ownership.

The page imports this repository's actual theme CSS and portal synchronizer. Its
controls remain **native HTML fixtures, not real `@destyler-ui` framework
components**. Nothing has been deployed; repository file links are not live previews.

See the [example guide](examples/scoped-themes/README.md) for the browser test page,
manual checks, and verification limits.

## Scope

- Original Neutral and Ember themes, each light and dark.
- One HTML contract using explicit `data-theme-root`, `data-scope`, `data-part`.
- Two independent source roots, native Checkbox, keyboard-operable Tabs, and
  native modal Dialog fixtures. These are **not real `@destyler-ui` components**
  and do not recreate the previous React/Vue/Solid/Svelte integration.
- Detached dialog roots receive an allowlisted set of computed CSS variables,
  including source-local overrides. Theme switching is available inside dialogs.
- Opt-in theme selectors; an un-themed checkbox baseline is included.

`styles/themes.css` uses CSS `@scope` with nested-root boundaries. Browsers must
support that feature; compatibility is not established here. A themed root's
own inherited typography/colors naturally apply to its descendants. Components
outside all theme roots receive no styles from this stylesheet. Arbitrary custom
markup is not automatically supported: use the documented hooks or an adapter.

## Non-browser checks

Requires Node 20+; no dependencies or install step.

```sh
npm test
npm run check
npm run test:http
```

The tests exercise the portal synchronizer with in-memory DOM test doubles,
cleanup, observation, stale values, separate roots, and static fixture contracts.
The HTTP smoke checks serve the example and assets over a loopback socket. These
Node checks do **not** prove real DOM inheritance, computed style, native dialog behavior,
focus restoration, visual appearance, or accessibility.

## Portal integration

```js
import { bindPortalTheme } from './src/portal-theme.js'
const binding = bindPortalTheme(sourceRoot, detachedPortalRoot)
// Call after stylesheet or ancestor changes not on sourceRoot itself:
binding.sync()
// Call when unmounting; original portal attributes and tokens are restored:
binding.dispose()
```

The source and portal must be distinct, non-nested elements. Own the binding once
per portal; dispose it before rebinding or changing portal ownership. Do not
independently mutate theme attributes/tokens on the bound portal. Root attribute
changes to `data-skin`, `data-theme`, `style`, and `class` are observed; keep
`data-theme-root` present for the binding lifetime. External stylesheet changes, ancestor changes, system color
preferences, and CSS animation are not observed automatically. Synchronize those
explicitly. Token allowlisting deliberately avoids copying unrelated properties.

## Provenance and limitations

All committed source and tests were authored for this reconstruction; no
third-party code, assets, packages, fonts, or remotely loaded resources are used.
No repository-wide license is assigned by this prototype: the repository owner
must choose licensing before redistribution as a package. `private: true` prevents
accidental npm publication.

The example includes 23 browser checks for actual DOM/computed styles. They have
not been executed in this cloud environment: the cloud browser could not reach
the execution context's loopback server, and observing its error page was blocked
by URL policy. No browser security restriction was bypassed. No visual screenshot
has been verified. No claims are made about four-framework integration,
SSR/hydration, browser compatibility, mobile layouts, complete accessibility,
real UI component interoperability, or visual parity with the earlier pilot.
