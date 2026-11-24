import type { Demo } from './demo-types'
import type { Framework } from './host'

const packageName = '@destyler/ready-prototype'
const implementationRevision = 'fadc289d06031827dba90bda2a1a4f20694e52f4'
const barrelComponents = new Set(['Checkbox', 'Select', 'Dialog'])
const indent = (code: string, spaces: number) => code.split('\n').map(line => line ? ' '.repeat(spaces) + line : line).join('\n')
const literal = (value: unknown) => JSON.stringify(value, null, 2)
const text = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/{/g, '&#123;').replace(/}/g, '&#125;')

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

  const propsType = vue ? `InstanceType<typeof ${name}>['$props']` : `ComponentProps<typeof ${name}>`
  const props = demo.action ? `Omit<${propsType}, 'controller'>` : propsType
  const declarations = [`const props = ${literal(args)} satisfies ${props}`]
  if (demo.child && typeof demo.child !== 'string') {
    declarations.push(`const fieldProps = ${literal(demo.child.args)} satisfies ${vue ? "InstanceType<typeof Field>['$props']" : 'ComponentProps<typeof Field>'}`)
  }

  const binding = vue ? 'v-bind="props"' : '{...props}'
  const attributes = [binding]
  if (demo.action) attributes.push(vue ? ':controller="controller"' : 'controller={controller}')
  if (jsx) for (const [key, value] of Object.entries(demo.slots ?? {})) attributes.push(`${key}={${literal(value)}}`)

  const children: string[] = []
  if (typeof demo.child === 'string') children.push(text(demo.child))
  else if (demo.child) children.push(vue ? '<Field v-bind="fieldProps" />' : '<Field {...fieldProps} />')
  if (!jsx) for (const [key, value] of Object.entries(demo.slots ?? {})) {
    // Vue's named slots and Svelte 5's named snippets are aliased by their public prop names.
    children.push(vue ? `<template #${key}>${text(value)}</template>` : `{#snippet ${key}()}${text(value)}{/snippet}`)
  }

  const opening = `<${name} ${attributes.join(' ')}`
  const preview = children.length
    ? `${opening}>\n${indent(children.join('\n'), 2)}\n</${name}>`
    : `${opening} />`
  const markup = name === 'Separator' ? ['<p>Workspace details</p>', preview, '<p>Notification preferences</p>'] : [preview]
  if (name === 'Label') markup.push(vue ? `<input :id="props.${labelKey}" />` : `<input id={props.${labelKey}} />`)

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
    importsCode.unshift(framework === 'React' && demo.action
      ? "import { useState, type ComponentProps } from 'react'"
      : `import type { ComponentProps } from '${library}'`)
  }
  const header = importsCode.join('\n') + '\n\n' + declarations.join('\n\n')
  const content = markup.join('\n')
  if (jsx) {
    const result = markup.length === 1 ? content : `<>\n${indent(content, 2)}\n</>`
    return `${header}\n\nexport default function Example() {\n${setup.length ? indent(setup.join('\n'), 2) + '\n\n' : ''}  return (\n${indent(result, 4)}\n  )\n}\n`
  }

  const script = indent([header, ...setup].join('\n\n'), 2)
  const scriptTag = vue ? '<script setup lang="ts">' : '<script lang="ts">'
  return `${scriptTag}\n${script}\n</script>\n\n${vue ? `<template>\n${indent(content, 2)}\n</template>` : content}\n`
}
