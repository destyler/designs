<script lang="ts">
  import { createRawSnippet, type Component } from 'svelte'
  import * as components from '../../../packages/ready/svelte'
  import { componentFor, type Demo } from '../demo-types'

  let { name, demo }: { name: string; demo: Demo } = $props()
  const DemoComponent = $derived(componentFor<Component>(components, name))
  const forId = $derived(name === 'Label' ? (demo.args as { for: string }).for : undefined)
  const controller = $derived(demo.action ? components.createToastController() : undefined)
  const slots = $derived(Object.fromEntries(Object.entries(demo.slots ?? {}).map(([key, text]) => [key,
    createRawSnippet(() => ({
      render: () => '<span></span>',
      setup: (node) => { node.textContent = text },
    })),
  ])))
</script>

{#snippet content()}
  {#if typeof demo.child === 'string'}
    {demo.child}
  {:else if demo.child}
    <components.Field {...demo.child.args} />
  {/if}
{/snippet}

{#if name === 'Separator'}<p>Workspace details</p>{/if}
<DemoComponent {...demo.args} {...slots} {...controller ? { controller } : {}} {...demo.child ? { children: content } : {}} />
{#if name === 'Separator'}<p>Notification preferences</p>{/if}
{#if forId}<input id={forId} class="story-input" />{/if}
{#if demo.action}
  <button type="button" class="rd-button story-action" onclick={() => demo.action && controller?.show(demo.action.message)}>{demo.action.label}</button>
{/if}
