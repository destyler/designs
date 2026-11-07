<script lang="ts">
  import { Menu } from '@destyler-ui/svelte/menu'
  const items = ['react', 'solid', 'vue', 'svelte']
  let checked = $state(false)
  let framework = $state('')
  let css = $state('')
</script>

<div class="parity-stack"><Menu.Root>
  <Menu.Trigger>Open menu </Menu.Trigger>
  <Menu.Positioner data-testid="positioner">
    <Menu.Content>

      <Menu.ItemGroup><Menu.ItemGroupLabel>Framework menu</Menu.ItemGroupLabel><Menu.Item value="dialog" disabled>Dialog</Menu.Item></Menu.ItemGroup>
      <Menu.Separator />
      <Menu.CheckboxItem bind:checked value="my-checkbox"><Menu.ItemIndicator>✓</Menu.ItemIndicator><Menu.ItemText>Check me</Menu.ItemText></Menu.CheckboxItem>
      <Menu.Separator />
      <Menu.RadioItemGroup bind:value={framework}>
        <Menu.ItemGroupLabel>JS Frameworks</Menu.ItemGroupLabel>
        {#each items as item}<Menu.RadioItem value={item}><Menu.ItemIndicator>✓</Menu.ItemIndicator><Menu.ItemText>{item}</Menu.ItemText></Menu.RadioItem>{/each}
      </Menu.RadioItemGroup>
      <Menu.Separator />
      <Menu.Root>
        <Menu.TriggerItem>CSS Frameworks</Menu.TriggerItem>
        <Menu.Positioner><Menu.Content><Menu.Item value="unocss" onclick={() => css = 'UnoCSS'}>UnoCSS</Menu.Item><Menu.Item value="tailwind" onclick={() => css = 'Tailwind'}>Tailwind</Menu.Item></Menu.Content></Menu.Positioner>
      </Menu.Root>
    </Menu.Content>
  </Menu.Positioner>
</Menu.Root>
<p role="status" class="parity-status">{framework || 'No framework'}{css ? ` · ${css}` : ''}{checked ? ' · Checked' : ''}</p></div>
