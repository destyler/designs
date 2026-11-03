<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox, Dialog, Switch, Tabs } from '@destyler-ui/vue'
import { recipes as r } from '../styles/recipes'
defineProps<{ dark: boolean }>()
const marketing = ref(false)
const updates = ref(true)
const tips = ref<boolean | 'indeterminate'>(true)
</script>
<template>
  <Tabs.Root default-value="notifications" :class="r.tabs+' w-full'">
    <Tabs.List :class="r['tabs-list']+' w-full'" data-variant="default"><Tabs.Trigger value="notifications" :class="r['tabs-trigger']">Notifications</Tabs.Trigger><Tabs.Trigger value="security" :class="r['tabs-trigger']">Security</Tabs.Trigger></Tabs.List>
    <Tabs.Content value="notifications" :class="r['tabs-content']">
      <div :class="r.card" data-slot="card"><div :class="r['card-header']"><div :class="r['card-title']">Notifications</div><div :class="r['card-description']">Choose what you want to hear about.</div></div>
        <div :class="r['card-content']+' grid gap-6'">
          <Switch.Root v-model:checked="marketing" class="demo-row"><div class="demo-row-copy"><Switch.Label :class="r.label">Marketing emails</Switch.Label><p class="demo-copy">News, offers, and product inspiration.</p></div><Switch.Control data-size="default" :class="r.switch"><Switch.Thumb :class="r['switch-thumb']"/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root>
          <Switch.Root v-model:checked="updates" class="demo-row"><div class="demo-row-copy"><Switch.Label :class="r.label">Product updates</Switch.Label><p class="demo-copy">New features and improvements.</p></div><Switch.Control data-size="default" :class="r.switch"><Switch.Thumb :class="r['switch-thumb']"/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root>
          <Checkbox.Root v-model:checked="tips" class="flex items-center gap-3 border-t pt-5"><Checkbox.Control :class="r.checkbox"><Checkbox.Indicator :class="r['checkbox-indicator']"><svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></Checkbox.Indicator></Checkbox.Control><Checkbox.Label :class="r.label">Include helpful tips</Checkbox.Label><Checkbox.HiddenInput/></Checkbox.Root>
        </div>
        <div :class="r['card-footer']"><Dialog.Root class="w-full"><Dialog.Trigger :class="r.button+' w-full'">Review preferences</Dialog.Trigger>
          <Teleport to="body"><div data-design="shadcn" :class="dark ? 'dark' : ''" data-portal-owner="vue"><Dialog.Backdrop :class="r['dialog-overlay']"/><Dialog.Positioner><Dialog.Content data-demo-dialog="vue" :class="r['dialog-content']"><div :class="r['dialog-header']"><Dialog.Title :class="r['dialog-title']">Your preferences</Dialog.Title><Dialog.Description :class="r['dialog-description']">Demo only. No settings are sent or stored.</Dialog.Description></div><p class="text-sm">Marketing: {{ marketing ? 'on' : 'off' }} · Updates: {{ updates ? 'on' : 'off' }} · Tips: {{ tips ? 'on' : 'off' }}</p><div :class="r['dialog-footer']"><Dialog.CloseTrigger :class="r.button">Done</Dialog.CloseTrigger></div></Dialog.Content></Dialog.Positioner></div></Teleport>
        </Dialog.Root></div>
      </div>
    </Tabs.Content>
    <Tabs.Content value="security" :class="r['tabs-content']"><div :class="r.card" data-slot="card"><div :class="r['card-header']"><div :class="r['card-title']">Security</div><div :class="r['card-description']">Important alerts are always enabled.</div></div><div :class="r['card-content']+' grid gap-6'">
      <Switch.Root checked disabled class="demo-row"><Switch.Label :class="r.label">Security alerts</Switch.Label><Switch.Control data-size="default" :class="r.switch"><Switch.Thumb :class="r['switch-thumb']"/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root>
      <Checkbox.Root checked disabled class="flex items-center gap-3"><Checkbox.Control :class="r.checkbox"><Checkbox.Indicator :class="r['checkbox-indicator']"><svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></Checkbox.Indicator></Checkbox.Control><Checkbox.Label :class="r.label">Required account notices</Checkbox.Label><Checkbox.HiddenInput/></Checkbox.Root>
      <p class="demo-notice">These controls demonstrate the disabled state.</p>
    </div></div></Tabs.Content>
  </Tabs.Root>
</template>
