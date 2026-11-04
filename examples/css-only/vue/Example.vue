<script setup lang="ts">
import '@destyler/designs-css-only-poc/styles.css'
import { onMounted, ref } from 'vue'
import { Switch, Dialog, LocaleProvider } from '@destyler-ui/vue'
const mounted = ref(false)
const checked = ref(true)
onMounted(() => { mounted.value = true })
const cases = [{ label: 'Updates', checked: true }, { label: 'Small', checked: false, small: true }, { label: 'Disabled', checked: true, disabled: true }, { label: 'Readonly', checked: true, readOnly: true }, { label: 'RTL', checked: true, rtl: true }]
</script>
<template>
  <div data-cases>
    <LocaleProvider v-for="item in cases" :key="item.label" :locale="item.rtl ? 'ar' : 'en-US'">
    <Switch.Root :default-checked="item.label === 'Updates' ? undefined : item.checked" :checked="item.label === 'Updates' ? checked : undefined" @checked-change="details => { if (item.label === 'Updates') checked = details.checked }" :disabled="item.disabled" :read-only="item.readOnly" :data-case="item.label.toLowerCase()">
      <Switch.Control :data-size="item.small ? 'sm' : undefined"><Switch.Thumb /></Switch.Control>
      <Switch.Label>{{ item.label }}</Switch.Label><Switch.HiddenInput role="switch" />
    </Switch.Root>
    </LocaleProvider>
  </div>
  <Dialog.Root id="css-only-dialog">
    <Dialog.Trigger>Open dialog</Dialog.Trigger>
    <Teleport v-if="mounted" to="body">
      <Dialog.Backdrop />
      <Dialog.Positioner><Dialog.Content>
        <Dialog.Title>Dialog title</Dialog.Title>
        <Dialog.Description>This dialog uses only native anatomy and one CSS import.</Dialog.Description>
        <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
      </Dialog.Content></Dialog.Positioner>
    </Teleport>
  </Dialog.Root>
</template>
