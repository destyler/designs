// Run in fresh processes: server imports must never inherit a DOM shim.
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { runInThisContext } from 'node:vm'
const [framework, mode, entry, output, htmlFile, variant = 'styled', compiledDir] = process.argv.slice(2)
const result = { framework, mode, variant, domPresentAtStart: typeof window !== 'undefined', errors: [], warnings: [] }
const originalError = console.error, originalWarn = console.warn
console.error = (...args) => result.errors.push(args.map(String).join(' '))
console.warn = (...args) => result.warnings.push(args.map(String).join(' '))
let win
try {
  if (mode === 'hydrate') {
    const { Window } = await import('happy-dom')
    win = new Window({ url: 'http://localhost/', settings: { disableCSSFileLoading: true } })
    for (const key of Object.getOwnPropertyNames(win)) {
      if (['window', 'document', 'navigator'].includes(key) || /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|KeyboardEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(key)) {
        try { Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: win[key] }) } catch {}
      }
    }
    for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[key] = win[key].bind(win)
    globalThis.window = win; globalThis.document = win.document
    document.body.innerHTML = `<div id="app">${await readFile(htmlFile, 'utf8')}</div>`
  }
  const styles = variant === 'styled' ? await import(pathToFileURL(entry)) : { classes: {}, themes: {} }
  const c = styles.classes
  let tree, render, hydrate, cleanup
  if (framework === 'react') {
    const React = await import('react')
    const { Switch, Dialog } = await import('@destyler-ui/react')
    const h = React.createElement
    tree = h('section', { className: styles.themes.light },
      h(Switch.Root, { id: 'ssr-switch', className: c.switchRoot },
        h(Switch.Label, { className: c.switchLabel }, 'Notifications'),
        h(Switch.Control, { className: c.switchControl }, h(Switch.Thumb, { className: c.switchThumb })),
        h(Switch.HiddenInput, { role: 'switch' })),
      h(Dialog.Root, { id: 'ssr-dialog' }, h(Dialog.Trigger, { className: c.button }, 'Open settings'),
        h(Dialog.Backdrop, { className: c.dialogBackdrop }),
        h(Dialog.Positioner, { className: c.dialogPositioner },
          h(Dialog.Content, { className: c.dialogContent }, h(Dialog.Title, { className: c.dialogTitle }, 'Settings'),
            h(Dialog.Description, { className: c.dialogDescription }, 'Dialog description'),
            h(Dialog.CloseTrigger, { className: c.dialogClose }, 'Close')))))
    render = async () => (await import('react-dom/server')).renderToString(tree)
    hydrate = async () => {
      const root = (await import('react-dom/client')).hydrateRoot(document.querySelector('#app'), tree, { onRecoverableError: e => result.errors.push(String(e)) })
      cleanup = () => root.unmount()
    }
  } else if (framework === 'vue') {
    const { h, createSSRApp } = await import('vue')
    const { Switch, Dialog } = await import('@destyler-ui/vue')
    const comp = { render: () => h('section', { class: styles.themes.light }, [
      h(Switch.Root, { id: 'ssr-switch', class: c.switchRoot }, { default: () => [
        h(Switch.Label, { class: c.switchLabel }, { default: () => 'Notifications' }),
        h(Switch.Control, { class: c.switchControl }, { default: () => h(Switch.Thumb, { class: c.switchThumb }) }),
        h(Switch.HiddenInput, { role: 'switch' })] }),
      h(Dialog.Root, { id: 'ssr-dialog' }, { default: () => [
        h(Dialog.Trigger, { class: c.button }, { default: () => 'Open settings' }),
        h(Dialog.Backdrop, { class: c.dialogBackdrop }),
        h(Dialog.Positioner, { class: c.dialogPositioner }, { default: () => h(Dialog.Content, { class: c.dialogContent }, { default: () => [
          h(Dialog.Title, { class: c.dialogTitle }, { default: () => 'Settings' }),
          h(Dialog.Description, { class: c.dialogDescription }, { default: () => 'Dialog description' }),
          h(Dialog.CloseTrigger, { class: c.dialogClose }, { default: () => 'Close' })] }) })] })]) }
    tree = createSSRApp(comp)
    render = async () => (await import('@vue/server-renderer')).renderToString(tree)
    hydrate = async () => { tree.mount(document.querySelector('#app')); cleanup = () => tree.unmount() }
  }
  if (framework === 'solid' || framework === 'svelte') {
    const compiled = await import(pathToFileURL(`${compiledDir}/${framework}-${mode}.mjs`))
    if (framework === 'solid') {
      if (mode === 'ssr') await writeFile(htmlFile + '.bootstrap.js', compiled.hydrationScript.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
      else { runInThisContext(await readFile(htmlFile + '.bootstrap.js', 'utf8')); result.officialHydrationBootstrap = true }
    }
    render = async () => compiled.run(styles)
    hydrate = async () => { cleanup = await compiled.run(styles, document.querySelector('#app')) }
  }
  if (mode === 'ssr') {
    const html = await render()
    await writeFile(htmlFile, html)
    result.htmlBytes = Buffer.byteLength(html)
    result.hasSwitch = /data-scope="switch"/.test(html)
    result.hasDialogTrigger = /data-part="trigger"/.test(html)
    result.hasDialogContent = /data-part="content"/.test(html)
    if (!result.hasSwitch || !result.hasDialogTrigger || !result.hasDialogContent) throw new Error('Real primitive markup missing')
  } else {
    const originalControl = document.querySelector('[data-scope="switch"][data-part="control"]')
    const originalTrigger = document.querySelector('[data-scope="dialog"][data-part="trigger"]')
    await hydrate()
    await new Promise(resolve => setTimeout(resolve, 80))
    result.serverNodesRetained = originalControl === document.querySelector('[data-scope="switch"][data-part="control"]') && originalTrigger === document.querySelector('[data-scope="dialog"][data-part="trigger"]')
    if (!result.serverNodesRetained) throw new Error('Hydration replaced server-rendered controls')
    const input = document.querySelector('input[role="switch"]')
    if (!input) throw new Error('Switch input missing after hydration')
    input.click()
    await new Promise(resolve => setTimeout(resolve, 80))
    result.switchInteractive = input.checked
    const trigger = document.querySelector('[data-scope="dialog"][data-part="trigger"]')
    trigger.click()
    await new Promise(resolve => setTimeout(resolve, 80))
    result.dialogInteractive = !!document.querySelector('[data-scope="dialog"][data-part="content"][data-state="open"]')
    document.querySelector('[data-scope="dialog"][data-part="close-trigger"]').click()
    await new Promise(resolve => setTimeout(resolve, 80))
    result.dialogClosed = !document.querySelector('[data-scope="dialog"][data-part="content"][data-state="open"]')
    trigger.click()
    await new Promise(resolve => setTimeout(resolve, 80))
    result.dialogReopened = !!document.querySelector('[data-scope="dialog"][data-part="content"][data-state="open"]')
    await cleanup()
    if (!result.switchInteractive || !result.dialogInteractive || !result.dialogClosed || !result.dialogReopened) throw new Error('Hydrated primitive interaction failed')
  }
  result.pass = result.errors.length === 0
} catch (error) { result.pass = false; result.exception = String(error.stack || error) }
finally {
  console.error = originalError; console.warn = originalWarn
  if (win) await win.happyDOM.close()
  await writeFile(output, JSON.stringify(result, null, 2) + '\n')
  process.stdout.write(JSON.stringify(result) + '\n')
}
