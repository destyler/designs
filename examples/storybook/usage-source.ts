import type { Demo } from './demo-types'
import type { Framework } from './host'

const packageName = '@destyler/ready-prototype'
const implementationRevision = 'cd6b8fb858dbcacea48e7d889178844cdfb1baa3'
const barrelComponents = new Set(['Checkbox', 'Select', 'Dialog'])
const indent = (code: string, spaces: number) => code.split('\n').map(line => line ? ' '.repeat(spaces) + line : line).join('\n')
const literal = (value: unknown) => JSON.stringify(value, null, 2)
const attrText = (value: string) => text(value).replace(/"/g, '&quot;')
const vuePropName = (key: string) => key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())
const text = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/{/g, '&#123;').replace(/}/g, '&#125;')

export function getInstallUrl(): string {
  return `https://github.com/destyler/designs/blob/${implementationRevision}/docs/ready-quickstart.md`
}

export function getImplementationUrl(name: string, framework: Framework): string {
  const folder = framework.toLowerCase()
  const file = framework === 'Vue' ? `${name}.vue`
    : framework === 'Svelte' ? `${name}.svelte`
      : barrelComponents.has(name) ? 'index.tsx' : `${name}.tsx`
  return `https://github.com/destyler/designs/blob/${implementationRevision}/packages/ready/${folder}/${file}`
}

export function getUsageSource(name: string, framework: Framework, demo: Demo): string {
  const jsx = framework === 'React' || framework === 'Solid'
  const vue = framework === 'Vue'
  const args = { ...demo.args } as Record<string, unknown>
  if (name === 'Label' && framework === 'React') {
    args.htmlFor = args.for
    delete args.for
  }
  const labelKey = framework === 'React' ? 'htmlFor' : 'for'
  const imports = new Set([name])
  if (demo.child && typeof demo.child !== 'string') imports.add(demo.child.component)
  if (demo.action) imports.add('createToastController')

  const declarations: string[] = []
  const binding = (key: string, expression: string) => vue
    ? `:${vuePropName(key)}="${attrText(expression)}"`
    : `${key}={${expression}}`
  const attributesFor = (component: string, values: Record<string, unknown>): string[] => {
    return Object.entries(values).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${vue ? vuePropName(key) : key}="${attrText(value)}"`
      }
      if (value === null || typeof value !== 'object') return binding(key, literal(value))
      // Arrays and objects stay individually named and typed: the template still
      // shows exactly which prop receives each value, without a spread object.
      const propType = vue
        ? `InstanceType<typeof ${component}>['$props']['${key}']`
        : `ComponentProps<typeof ${component}>['${key}']`
      declarations.push(`const ${key}: ${propType} = ${literal(value)}`)
      return binding(key, key)
    })
  }
  const attributes = attributesFor(name, args)
  if (demo.action) attributes.push(binding('controller', 'controller'))
  if (jsx) for (const [key, value] of Object.entries(demo.slots ?? {})) attributes.push(binding(key, literal(value)))

  const children: string[] = []
  if (typeof demo.child === 'string') children.push(text(demo.child))
  else if (demo.child) children.push(`<${demo.child.component} ${attributesFor(demo.child.component, demo.child.args).join(' ')} />`)
  if (!jsx) for (const [key, value] of Object.entries(demo.slots ?? {})) {
    // Vue's named slots and Svelte 5's named snippets are aliased by their public prop names.
    children.push(vue ? `<template #${key}>${text(value)}</template>` : `{#snippet ${key}()}${text(value)}{/snippet}`)
  }

  const opening = attributes.length > 2
    ? `<${name}\n${indent(attributes.join('\n'), 2)}\n`
    : `<${name}${attributes.length ? ' ' + attributes.join(' ') : ''}`
  const preview = children.length
    ? `${opening}>\n${indent(children.join('\n'), 2)}\n</${name}>`
    : `${opening}${attributes.length > 2 ? '' : ' '}/>`
  const markup = name === 'Separator' ? ['<p>Workspace details</p>', preview, '<p>Notification preferences</p>'] : [preview]
  if (name === 'Label') markup.push(`<input id="${attrText(String(args[labelKey]))}" />`)

  const setup: string[] = []
  if (demo.action) {
    setup.push(framework === 'React' ? 'const [controller] = useState(createToastController)' : 'const controller = createToastController()')
    setup.push(`function notify() {\n  controller.show(${indent(literal(demo.action.message), 2).trimStart()})\n}`)
    const handler = jsx ? 'onClick={notify}' : vue ? '@click="notify"' : 'onclick={notify}'
    markup.push(`<button type="button" ${handler}>${text(demo.action.label)}</button>`)
  }

  const importsCode = [
    `import { ${[...imports].join(', ')} } from '${packageName}/${framework.toLowerCase()}'`,
    `import '${packageName}/theme.css'`,
  ]
  if (!vue) {
    const library = framework === 'React' ? 'react' : framework === 'Solid' ? 'solid-js' : 'svelte'
    if (framework === 'React' && demo.action) importsCode.unshift(declarations.length
      ? "import { useState, type ComponentProps } from 'react'" : "import { useState } from 'react'")
    else if (declarations.length) importsCode.unshift(`import type { ComponentProps } from '${library}'`)
  }
  const header = [importsCode.join('\n'), ...declarations].join('\n\n')
  const content = markup.join('\n')
  if (jsx) {
    const result = markup.length === 1 ? content : `<>\n${indent(content, 2)}\n</>`
    return `${header}\n\nexport default function Example() {\n${setup.length ? indent(setup.join('\n'), 2) + '\n\n' : ''}  return (\n${indent(result, 4)}\n  )\n}\n`
  }

  const script = indent([header, ...setup].join('\n\n'), 2)
  const scriptTag = vue ? '<script setup lang="ts">' : '<script lang="ts">'
  return `${scriptTag}\n${script}\n</script>\n\n${vue ? `<template>\n${indent(content, 2)}\n</template>` : content}\n`
}
