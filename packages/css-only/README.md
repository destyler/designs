# CSS-only Switch + Dialog proof

A private, unpublished proof for `@destyler-ui/react`, `/vue`, `/solid` and `/svelte` **0.0.1-beta.21**. Keep using those headless primitives. Add one application import:

```ts
import '@destyler/designs-css-only-poc/styles.css'
```

No generated class names, part-by-part style bindings, styling JavaScript, style compiler, Tailwind, UnoCSS, or vanilla-extract is required. The package exports CSS only and has no runtime or peer dependencies. Existing framework and headless UI code still run normally; UI-provided inline styles for hidden inputs, pointer events and stacking remain intact.

```tsx
import { Switch } from '@destyler-ui/react'

<Switch.Root>
  <Switch.Control><Switch.Thumb /></Switch.Control>
  <Switch.Label>Notifications</Switch.Label>
  <Switch.HiddenInput />
</Switch.Root>
```

The same native `data-scope`, `data-part` and state attributes are emitted by Vue, Solid and Svelte. No change is made to the headless UI packages. A plain `<link rel="stylesheet">` also works wherever the app can serve the stylesheet.

## Deliberate scope

Importing this stylesheet opts **every** `data-scope="switch"` and `data-scope="dialog"` component in that document into this design. Other anatomy and unrelated native buttons, paragraphs, etc. are not styled. The stylesheet does not have a global reset and does not target arbitrary descendants. Use a separate document/iframe to isolate another default design; CSS cannot both be zero-opt-in and distinguish identical anatomy that should remain unstyled.

Defaults use the pinned shadcn New York v4 Switch, Dialog surface and primary Button appearance. These are **not all shadcn variants**. There is no invented `header` or `footer` part, no inferred corner-close icon, and no extra theme wrappers required by the styling package. Both native Dialog Trigger and CloseTrigger use normal button styling. The consumer owns composition; CSS cannot infer whether a CloseTrigger means a footer button or corner icon. Dialog.Root is not a reliable DOM wrapper across frameworks, and is not used as a selector.

The optional `data-size="sm"` on Switch.Control requests the smaller track/thumb. This is a design variant, not an attribute UI automatically generates. It is unnecessary for the default appearance. Readonly/disabled/state/focus attributes keep the primitive's behavior. RTL uses the native `dir` emitted by UI's LocaleProvider, not a guessed document direction.

## Themes and portals

Light is the default. Set `data-theme="dark"` on `html` for an app-wide dark theme. Body portals automatically inherit this document theme. Nested `data-theme="light"` or `"dark"` scopes are supported. Override public `--dy-*` tokens with ordinary CSS; derived track/thumb colors resolve at the primitive so a descendant override is not frozen to the ancestor's value.

A body portal **cannot inherit a local trigger ancestor's theme or tokens via CSS**. If independently themed regions portal to body, put the same theme attribute and explicit token overrides on the existing portal container, or mount the portal inside the themed region. That is an opt-in application concern, not hidden styling JavaScript. SSR-safe portal mounting also remains the framework/UI responsibility. The examples use native portals after mount and have strict SSR/hydration tests.

## Cascade and browser support

All design rules are in `@layer destyler`; all selectors have zero specificity (`:where`). Unlayered application and UnoCSS rules override them without `!important`. If utilities are layered, establish the intended order before imports, e.g. `@layer reset, destyler, utilities;`. Do not place a later layered reset above the component layer. This package does not globally reset the page to make an example look correct.

The stylesheet uses modern CSS cascade layers, `color-mix()`, `light-dark()`, OKLCH and individual `translate`/`scale`. Target modern evergreen browsers that support these features. Reduced-motion rules disable transitions and minimize animation duration. Exit keyframes are present, but observable exit timing still depends on the primitive's presence/unmount behavior; native hidden state is never overridden merely to force animation.

## Source and verification

Derived from the vendored MIT shadcn source pinned to commit `4aaea19d9cff3e0908e12a8c1d504b8c5ec34610`; see `SHADCN-LICENSE` and `THIRD_PARTY_NOTICES.txt`. The original reference is built unchanged in a separate test page. See repository `docs/css-only-verification.md` for actual verification and known limits. This is a mergeable proof, not a published package or completed whole-library migration.
