<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Dialog, Switch } from '@destyler-ui/vue'
import { overrides, scopeClass, styles, type Engine } from '../shared/styles'
const props = withDefaults(defineProps<{ initialEngine: Engine; id: string; allowBaseline?: boolean }>(), { allowBaseline: true })
const engine = ref<Engine>(props.initialEngine)
const dark = ref(false)
const override = ref(false)
const utility = ref(false)
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const c = computed(() => styles(engine.value))
const theme = computed(() => scopeClass(dark.value))
const tokens = computed(() => override.value ? overrides : {})
const switches = [{ label: 'Updates', checked: true, size: 'default', disabled: false }, { label: 'Small', checked: false, size: 'sm', disabled: false }, { label: 'Disabled', checked: true, size: 'default', disabled: true }]
</script>
<template>
  <section :data-panel="id" data-framework="vue" :data-engine="engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'" :data-theme="dark ? 'dark' : 'light'" :class="['fixture-panel', theme]" :style="tokens">
    <h2>{{ engine === 'vanilla-extract' ? 'vanilla-extract' : 'Tailwind recipes' }}</h2>
    <div class="fixture-hint">Vue primitives · same tokens, different CSS pipeline</div>
    <div class="fixture-controls">
      <label>Engine <select aria-label="Style engine" v-model="engine"><option value="vanilla-extract">vanilla-extract</option><option value="tailwind" :disabled="!allowBaseline">Tailwind baseline</option></select></label>
      <label><input type="checkbox" v-model="dark" />Dark</label>
      <label><input type="checkbox" v-model="override" />Token override</label>
      <label><input type="checkbox" v-model="utility" />UnoCSS override</label>
    </div>
    <div class="fixture-switches">
      <Switch.Root v-for="item in switches" :key="item.label" :default-checked="item.checked" :disabled="item.disabled" :class="c.switchRoot" :data-size="item.size" :data-case="item.label.toLowerCase()">
        <Switch.Control :class="c.switchControl" :data-size="item.size"><Switch.Thumb :class="c.switchThumb" :data-size="item.size" /></Switch.Control>
        <Switch.Label :class="c.switchLabel">{{ item.label }}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root>
    </div>
    <p class="fixture-hint">Tab to a switch and press Space. Disabled stays unchanged.</p>
    <Dialog.Root>
      <Dialog.Trigger :class="[c.button, utility && 'fixture-utility-override']" data-action="open-dialog">Open dialog</Dialog.Trigger>
      <Teleport v-if="mounted" to="body">
        <div :class="['fixture-portal', theme]" :style="tokens" :data-portal-owner="id" :data-engine="engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'" :data-theme="dark ? 'dark' : 'light'">
          <Dialog.Backdrop :class="c.dialogBackdrop" />
          <Dialog.Positioner :class="c.dialogPositioner">
            <Dialog.Content :class="c.dialogContent" :data-demo-dialog="id">
              <div :class="c.dialogHeader"><Dialog.Title :class="c.dialogTitle">Your preferences</Dialog.Title><Dialog.Description :class="c.dialogDescription">Vue body portal · {{ dark ? 'dark' : 'light' }} · {{ override ? 'custom violet tokens' : 'default tokens' }}</Dialog.Description></div>
              <p>This body portal receives the same theme class and explicit token overrides as its panel.</p>
              <p class="fixture-hint">Tab stays inside. Escape, ×, or Done closes and returns focus.</p>
              <Dialog.CloseTrigger :class="c.dialogClose" aria-label="Close dialog">×</Dialog.CloseTrigger>
              <div :class="c.dialogFooter"><Dialog.CloseTrigger :class="c.button">Done</Dialog.CloseTrigger></div>
            </Dialog.Content>
          </Dialog.Positioner>
        </div>
      </Teleport>
    </Dialog.Root>
    <div class="fixture-token">{{ engine === 'vanilla-extract' ? 'dist/index.js + dist/styles.css' : 'Existing recipes → precompiled Tailwind CSS' }}<br />{{ override ? '--dy-primary: #7c3aed; --dy-radius: 1rem' : 'Scoped Zinc tokens · light / dark' }}<br />{{ utility ? 'UnoCSS: square corners + 32px horizontal padding' : 'UnoCSS override off' }}</div>
  </section>
</template>
