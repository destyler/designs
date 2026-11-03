# Scoped theme playground

A runnable example of the **existing native-HTML theme contract**, built entirely
in the cloud. The example imports `../../styles/themes.css` and
`../../src/portal-theme.js`; it does not duplicate those implementations or import
React, Vue, Solid, Svelte, or `@destyler-ui` components.

## Run it

Requires Node 20 or later. No install, build step, service account, or external
resource is needed.

```sh
npm run start:legacy
```

- Gallery: <http://127.0.0.1:4173/examples/scoped-themes/>
- Browser checks: <http://127.0.0.1:4173/examples/scoped-themes/checks.html>
- Minimal original fixture: <http://127.0.0.1:4173/examples/native-contract/>

The server binds to `127.0.0.1` only. Use `PORT=4174 npm run start:legacy` if 4173 is occupied
(PowerShell: `$env:PORT=4174; npm run start:legacy`). Serve the repository root if using another
static server; opening the HTML as a `file:` URL will not reliably load ES modules.
The standalone native playground is also retained in the deployed site. The root page now shows the separate source-backed React/Vue comparison; see the repository README.

## A two-minute walkthrough

1. Compare the four cards: Neutral light, Ember light, Neutral dark, Ember dark.
   Each uses the same template. The surrounding toolbar is demonstration chrome,
   not part of the reusable theme stylesheet.
2. Click **Dark mode / Light mode** or **Switch skin** on one card. Other cards,
   their checkboxes, and their selected tabs keep their own state.
3. Click **Local accent**. The source root receives a green accent and matching
   foreground override. The swatch shows its computed value; toggling it off
   restores the theme default. The override adapts when that card changes mode.
4. Click **Open dialog**. The native modal is a direct child of `body`, not the
   source card. Expand **Compare all 9 public tokens** to inspect source/portal
   values. Change mode or local accent inside the open dialog.
5. Close it, then open a different card's dialog. The shared portal gets a fresh
   binding from that card; closing disposes the binding and restores the portal.
   Escape and focus restoration are manual verification steps below.
6. Inspect the nested Ember-dark / Neutral-light example and the adjacent
   un-themed native baseline. Click **Reset** or **Reset all** to restore themes,
   overrides, selected tabs, and checkboxes.

## Verification

```sh
npm test          # 12 Node unit / static contract / server-handler tests
npm run check    # Syntax-check all example, source, script and test JS
npm run test:http # Actual loopback HTTP: eight assets + metadata protection
```

Open the browser-check page and click **Run browser checks**. It runs 23 checks
against the actual gallery in a visible same-origin iframe, displays each result,
and resets the fixture afterwards. Run it again to check a clean repeat. A load
failure times out and is reported instead of remaining pending forever.

The suite covers independent roots, computed styling, native-vs-themed baseline,
nested roots, checkboxes, keyboard tab selection, live token propagation, native
modal state, close/reopen ownership, disposal, focus restoration, reset, and ARIA
reference integrity. Clicks and keyboard events are synthetic. It is a focused
regression suite, not a substitute for trusted input, visual, accessibility, or
cross-browser testing.

### Manual checks still required

- At desktop and 390px/320px viewport widths, inspect layout, overflow, readable
  labels, and the dialog's scrolling.
- Use Tab/Shift+Tab to reach controls and see focus; arrow keys, Home, and End must
  move between enabled tabs without selecting the disabled Archive tab.
- Open the dialog with keyboard input. Tab must remain inside; Escape and Close
  must dismiss it and return focus to the exact opener. Reopen repeatedly and
  switch source cards.
- Navigate to the minimal fixture and use Back/Forward, then verify that gallery
  controls and modal ownership still work after history restoration.
- Check in browsers that implement CSS `@scope` and native `dialog`, then perform
  screen-reader and zoom/contrast review. The feature warning is only a capability
  check, not a browser support guarantee.

### Recorded result (2026-11-03)

- Node tests: **12 passed**.
- JS syntax and whitespace checks: **passed**.
- HTTP smoke: **passed** for the gallery and all required assets.
- Browser suite, screenshots, responsive layout, trusted keyboard flow:
  **not verified**. The cloud browser received `ERR_CONNECTION_REFUSED` when
  opening the execution context's loopback URL; observing that error page then
  hit the browser URL policy. No alternate browser/security bypass was used.
- Four-framework integration, SSR/hydration, and real `@destyler-ui`
  interoperability: **not implemented or tested by this example**.

This native fixture itself has no external assets or package dependencies. It is retained as a legacy experiment in the deployed repository, not the new framework integration. The example inherits the prototype's token contract and documented
synchronization limitations; it is not a production component library.
