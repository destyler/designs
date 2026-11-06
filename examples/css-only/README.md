# Four native CSS-only consumers

Each `Example.*` imports real published `@destyler-ui/*@0.0.4` primitives, with core `0.3.4` resolved in the repository lockfile. None supplies style classes, class maps or style objects. Every framework's `Example.*`, `SwitchExample.*` and `DialogExample.*` directly imports `@destyler/designs-css-only-poc/styles.css`. React and Solid use a module import, Vue uses `<script setup>`, and Svelte uses `<script>`. No separate `styles.ts` entry is needed. Separate `shared/fixture.*` files only provide page layout and demo theme controls. Native data attributes are ordinary CSS selectors, not an UnoCSS Attributify dependency.

These imports are still document-wide static CSS, not scoped component styles or a styling runtime. The bundler resolves repeated imports of the same stylesheet. Import location does not add component-level isolation or change body-portal theme inheritance; the separate preview documents still provide isolation. SSR and hydration use each framework's ordinary compiler, with the same mounted-portal behavior as before.

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

Production fixtures are `dist/css-only/{react,vue,solid,svelte,reference}/`. The root build now includes them, and the Astro five-panel comparison embeds each framework's `?showcase=1` mode. That mode renders only the selected `SwitchExample` or `DialogExample`; the IDE shows those exact files and package CSS. All four framework panels use the same two tabs. Each displayed component includes its CSS import, so copying it does not require a separate import file. The component code has no design classes. The documented standalone route retains broader verification cases.

For a browser-capable environment, serve `dist/` with the project's normal static server, or use a deployed preview:

```sh
BASE_URL=http://127.0.0.1:4173 CHROMIUM_PATH=/usr/bin/chromium node scripts/test-css-only-browser.mjs
```

The browser suite generates its real UnoCSS override locally and injects it, so the deployed application does not need a special test CSS asset. The browser suite compares real computed styles to the pinned shadcn page and exercises keyboard/focus, light/dark, overrides, RTL, repeated portal dismissal, responsive width, reduced motion, and CSS-without-fixture-reset. Browser launch is currently blocked in this cloud executor; the script is provided, not claimed to have passed. See `docs/css-only-verification.md`.
