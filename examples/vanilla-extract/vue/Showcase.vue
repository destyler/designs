<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Dialog, Switch } from '@destyler-ui/vue'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState, notifications } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'
const view = ref(initialShowcaseState())
const checked = ref<Record<string, boolean>>({ updates: true, marketing: false, security: true })
const mounted = ref(false)
let disconnect: (() => void) | undefined
onMounted(() => { mounted.value = true; disconnect = connectShowcase(value => { view.value = value }) })
onUnmounted(() => disconnect?.())
const theme = computed(() => themes[view.value.theme])
</script>
<template>
  <main :class="['showcase-stage', theme]" data-framework="vue" :data-theme="view.theme">
    <section v-if="view.component === 'switch'" class="showcase-card" aria-label="Notifications">
      <header class="showcase-heading"><h2>Notifications</h2><p>Choose what reaches your inbox.</p></header>
      <div class="showcase-stack">
        <Switch.Root v-for="item in notifications" :key="item.key" :checked="checked[item.key]" @checked-change="details => checked[item.key] = details.checked" :disabled="item.disabled" :class="[c.switchRoot, 'showcase-row', item.disabled && 'showcase-disabled']" :data-case="item.key">
          <div class="showcase-copy"><Switch.Label class="showcase-label">{{ item.label }}</Switch.Label><p class="showcase-description">{{ item.description }}</p></div>
          <Switch.Control :class="c.switchControl"><Switch.Thumb :class="c.switchThumb"/></Switch.Control><Switch.HiddenInput role="switch"/>
        </Switch.Root>
        <p class="showcase-status" role="status">{{ Object.values(checked).filter(Boolean).length }} of 3 notifications enabled.</p>
      </div>
    </section>
    <section v-else class="showcase-card showcase-dialog-card" aria-label="Notification preferences">
      <header class="showcase-heading"><h2>Notification preferences</h2><p>A little less noise. The updates that matter.</p></header>
      <div class="showcase-stack"><div v-for="[label, value] in [['Product updates', 'On'], ['Marketing emails', 'Off'], ['Helpful tips', 'On']]" :key="label" class="showcase-row"><span class="showcase-label">{{ label }}</span><span class="showcase-description">{{ value }}</span></div></div>
      <Dialog.Root><Dialog.Trigger :class="[c.button, 'showcase-open']">Review preferences</Dialog.Trigger>
        <Teleport v-if="mounted" to="body"><div :class="['showcase-portal', theme]" data-portal-owner="vue" :data-theme="view.theme">
          <Dialog.Backdrop :class="c.dialogBackdrop"/><Dialog.Positioner :class="c.dialogPositioner"><Dialog.Content :class="c.dialogContent" data-demo-dialog="vue">
            <div :class="c.dialogHeader"><Dialog.Title :class="c.dialogTitle">Your preferences</Dialog.Title><Dialog.Description :class="c.dialogDescription">Demo only. No settings are sent or stored.</Dialog.Description></div>
            <p>Marketing: off · Updates: on · Tips: on</p>
            <div :class="c.dialogFooter"><Dialog.CloseTrigger :class="c.button">Done</Dialog.CloseTrigger></div>
          </Dialog.Content></Dialog.Positioner>
        </div></Teleport>
      </Dialog.Root>
    </section>
  </main>
</template>
