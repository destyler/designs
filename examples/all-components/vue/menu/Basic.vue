<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from '@destyler-ui/vue'

const items = ref(['react', 'solid', 'vue', 'svelte'])
const checked = ref(false)
const framework = ref('')
const css = ref('')
</script>

<template>
  <div class="parity-stack"><Menu.Root>
    <Menu.Trigger>
      Open menu

    </Menu.Trigger>
    <Menu.Positioner data-testid="positioner">
      <Menu.Content>

        <Menu.ItemGroup>
          <Menu.ItemGroupLabel>Framework menu</Menu.ItemGroupLabel>
          <Menu.Item value="dialog" disabled>Dialog</Menu.Item>
        </Menu.ItemGroup>
        <Menu.Separator />
        <Menu.CheckboxItem v-model:checked="checked" value="my-checkbox">
          <Menu.ItemIndicator>✓</Menu.ItemIndicator>
          <Menu.ItemText>Check me</Menu.ItemText>
        </Menu.CheckboxItem>
        <Menu.Separator />
        <Menu.RadioItemGroup v-model="framework">
          <Menu.ItemGroupLabel>JS Frameworks</Menu.ItemGroupLabel>
          <Menu.RadioItem v-for="item in items" :key="item" :value="item">
            <Menu.ItemIndicator>✓</Menu.ItemIndicator>
            <Menu.ItemText>{{ item }}</Menu.ItemText>
          </Menu.RadioItem>
        </Menu.RadioItemGroup>
        <Menu.Separator />
        <Menu.Root>
          <Menu.TriggerItem>CSS Frameworks</Menu.TriggerItem>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="unocss" @click="css = 'UnoCSS'">UnoCSS</Menu.Item>
              <Menu.Item value="tailwind" @click="css = 'Tailwind'">Tailwind</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Menu.Content>
    </Menu.Positioner>
  </Menu.Root><p role="status" class="parity-status">{{ framework || 'No framework' }}{{ css ? ` · ${css}` : '' }}{{ checked ? ' · Checked' : '' }}</p></div>
</template>
