<script lang="ts">
  import type { NavigationMenuRootProps } from '@destyler-ui/svelte/navigation-menu'
  import { NavigationMenu } from '@destyler-ui/svelte/navigation-menu'
  let { ...props }: NavigationMenuRootProps = $props()
  let selected = $state('')
</script>

<main>
<NavigationMenu.Root {...props}>
  <NavigationMenu.List>
    <NavigationMenu.Item value="getting-started">
      <NavigationMenu.Trigger value="getting-started">
        Getting started
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </NavigationMenu.Trigger>
    </NavigationMenu.Item>
    <NavigationMenu.Item value="components">
      <NavigationMenu.Trigger value="components">
        Components
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </NavigationMenu.Trigger>
    </NavigationMenu.Item>
    <NavigationMenu.Item value="docs"><NavigationMenu.Link value="docs" href="#" onclick={event => { event.preventDefault(); selected = 'Documentation' }}>Documentation</NavigationMenu.Link></NavigationMenu.Item>
    <NavigationMenu.Indicator><NavigationMenu.Arrow /></NavigationMenu.Indicator>
  </NavigationMenu.List>
  <NavigationMenu.ViewportPositioner><NavigationMenu.Viewport>
    <NavigationMenu.Content value="getting-started">
      <ul>
        <li><NavigationMenu.Link value="intro" href="#" onclick={event => { event.preventDefault(); selected = 'Introduction' }}><div>Introduction</div></NavigationMenu.Link></li>
        <li><NavigationMenu.Link value="install" href="#" onclick={event => { event.preventDefault(); selected = 'Installation' }}><div>Installation</div></NavigationMenu.Link></li>
        <li><NavigationMenu.Link value="typography" href="#" onclick={event => { event.preventDefault(); selected = 'Typography' }}><div>Typography</div></NavigationMenu.Link></li>
      </ul>
    </NavigationMenu.Content>
    <NavigationMenu.Content value="components">
      <ul>
        <li><NavigationMenu.Link value="alert-dialog" href="#" onclick={event => { event.preventDefault(); selected = 'Alert Dialog' }}><div>Alert Dialog</div></NavigationMenu.Link></li>
        <li><NavigationMenu.Link value="hover-card" href="#" onclick={event => { event.preventDefault(); selected = 'Hover Card' }}><div>Hover Card</div></NavigationMenu.Link></li>
        <li><NavigationMenu.Link value="progress" href="#" onclick={event => { event.preventDefault(); selected = 'Progress' }}><div>Progress</div></NavigationMenu.Link></li>



      </ul>
    </NavigationMenu.Content>
  </NavigationMenu.Viewport></NavigationMenu.ViewportPositioner>
</NavigationMenu.Root><p role="status" class="parity-status">{selected || 'Choose a section'}</p>
</main>
