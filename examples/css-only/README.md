# Four native CSS-only consumers

Each `Example.*` imports real published `@destyler-ui/*@0.0.1-beta.21` primitives. None supplies style classes, class maps or style objects. `main.*` imports its real `styles.ts` entry, which adds the one designs CSS import; separate `shared/fixture.*` files only provide page layout and demo theme controls. Native data attributes are ordinary CSS selectors, not an UnoCSS Attributify dependency.

The normal Vite configs have **only the framework plugin**. The CSS import resolves to the static package stylesheet. `scripts/verify-css-only.mjs` instead packs the package, installs it offline into a fresh directory, and builds all four consumers from that installed CSS. The bare Vite proof uses no plugins at all and emits no styling JavaScript.

Cases: controlled Updates, uncontrolled Small, Disabled, Readonly, and RTL (UI LocaleProvider). All five use the same CSS selectors. Dialog uses each framework's normal body portal after mount. Global document theme automatically reaches the portal without styling-package code; local themes do not cross DOM boundaries.

`reference/` imports the unchanged pinned upstream shadcn components, compiled with Tailwind on its own page. Its classes/compiler are reference-only, never required by the four Destyler consumers. The reference deliberately chooses a normal text Close button and no icon closer, matching the native anatomy-only composition. It does not invent header/footer parts.

From the repository root:

```sh
node scripts/build-css-only-consumers.mjs build
node scripts/build-css-only-consumers.mjs dev react --host 127.0.0.1 --port 4181
node scripts/build-css-only-consumers.mjs dev vue --host 127.0.0.1 --port 4182
node scripts/build-css-only-consumers.mjs dev solid --host 127.0.0.1 --port 4183
node scripts/build-css-only-consumers.mjs dev svelte --host 127.0.0.1 --port 4184
node scripts/verify-css-only.mjs
node scripts/verify-css-only-ssr.mjs
node scripts/verify-css-only-unocss.mjs
```

Production fixtures are `dist/css-only/{react,vue,solid,svelte,reference}/`. The root build now includes them, and the Astro five-panel comparison embeds each framework's `?showcase=1` mode. That mode renders only the selected `SwitchExample` or `DialogExample`; the IDE shows those exact files, the actual `styles.ts` import entry, and package CSS. The component code has no design classes. The documented standalone route retains broader verification cases.

For a browser-capable environment, serve `dist/` with the project's normal static server, or use a deployed preview:

```sh
BASE_URL=http://127.0.0.1:4173 CHROMIUM_PATH=/usr/bin/chromium node scripts/test-css-only-browser.mjs
```

The browser suite generates its real UnoCSS override locally and injects it, so the deployed application does not need a special test CSS asset. The browser suite compares real computed styles to the pinned shadcn page and exercises keyboard/focus, light/dark, overrides, RTL, repeated portal dismissal, responsive width, reduced motion, and CSS-without-fixture-reset. Browser launch is currently blocked in this cloud executor; the script is provided, not claimed to have passed. See `docs/css-only-verification.md`.
