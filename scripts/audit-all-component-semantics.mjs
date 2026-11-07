import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
const root = fileURLToPath(new URL('../', import.meta.url))
const base = join(root, 'examples/all-components')
const catalog = JSON.parse(await readFile(join(base, 'shared/catalog.json'), 'utf8'))
const react = JSON.parse(await readFile(join(base, 'react/.verification/ssr-html.json'), 'utf8'))
const vue = JSON.parse(await readFile(join(base, 'vue/.verification/ssr.json'), 'utf8'))
const report = { pass: true, cases: [], limitations: ['Static markup checks are not an accessibility audit or screen-reader test. Closed or client-only overlays may not be present in SSR. Native keyboard, focus and rendered contrast remain unverified.'] }
const win = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableIframePageLoading: true } })
for (const framework of catalog.frameworks) {
  for (const family of catalog.families) {
    const row = { framework, family, pass: true, errors: [] }
    try {
      const html = framework === 'react' ? react[family] : framework === 'vue' ? (vue[family].teleports.body || '') + vue[family].html : await readFile(join(base, framework, '.verification', family + '.html'), 'utf8')
      assert.equal(typeof html, 'string')
      win.document.body.innerHTML = html
      const ids = new Set()
      for (const element of win.document.querySelectorAll('[id]')) {
        if (/\s/.test(element.id)) row.errors.push(`Whitespace in id: ${element.id}`)
        if (ids.has(element.id)) row.errors.push(`Duplicate id: ${element.id}`)
        ids.add(element.id)
      }
      for (const element of win.document.querySelectorAll('[aria-labelledby]')) for (const id of element.getAttribute('aria-labelledby').split(/\s+/).filter(Boolean)) if (!ids.has(id)) row.errors.push(`Missing labelledby target: ${id}`)
      for (const element of win.document.querySelectorAll('[data-scope="toggle"][data-part="root"], [data-scope="splitter"][data-part="resize-trigger"]')) {
        const clone = element.cloneNode(true)
        for (const hidden of clone.querySelectorAll('[aria-hidden="true"], [hidden]')) hidden.remove()
        const named = element.getAttribute('aria-label')?.trim() || element.getAttribute('aria-labelledby')?.trim() || clone.textContent?.trim()
        if (!named) row.errors.push(`Unnamed interactive ${element.dataset.scope}/${element.dataset.part}`)
      }
      row.pass = row.errors.length === 0
    } catch (error) { row.pass = false; row.errors.push(String(error)) }
    if (!row.pass) report.pass = false
    report.cases.push(row)
  }
}
await win.happyDOM.close()
await mkdir(join(root, 'artifacts/all-components'), { recursive: true })
await writeFile(join(root, 'artifacts/all-components/semantics.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ pass: report.pass, cases: report.cases.length, failures: report.cases.filter(row => !row.pass) }, null, 2))
if (!report.pass) process.exitCode = 1
