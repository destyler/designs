<script setup lang="ts">
// @source-start: shared
import { ref, computed } from 'vue'
import {
  checkboxExamples,
  switchExamples,
  tabExamples,
  type DemoExample,
} from '../components/examples'
import { Checkbox, Dialog, Switch, Tabs } from '@destyler-ui/vue'
import { recipes as r } from '../styles/recipes'
const props = withDefaults(
  defineProps<{ dark: boolean; example?: DemoExample }>(),
  { example: 'settings' },
)
// @source-end: shared
// @source-start: controls-setup
const focusedChecked = ref<Record<string, boolean | 'indeterminate'>>({
  updates: true,
  marketing: false,
  security: true,
  tips: true,
  newsletter: false,
  required: true,
})
const focusedItems = computed(() =>
  props.example === 'switch' ? switchExamples : checkboxExamples,
)
const selectedCount = computed(
  () =>
    focusedItems.value.filter((item) => focusedChecked.value[item.key] === true)
      .length,
)
// @source-end: controls-setup
const marketing = ref(false)
const updates = ref(true)
const tips = ref<boolean | 'indeterminate'>(true)
</script>
<template>
  <div
    v-if="example === 'switch' || example === 'checkbox'"
    class="simple-demo sample-stack w-full"
  >
    <template v-for="item in focusedItems" :key="item.key">
      <!-- @source-start: switch -->
      <Switch.Root
        v-if="example === 'switch'"
        :checked="focusedChecked[item.key] === true"
        @update:checked="(value) => (focusedChecked[item.key] = value)"
        :disabled="item.disabled"
        :class="'sample-row' + (item.disabled ? ' sample-disabled' : '')"
      >
        <div class="demo-row-copy">
          <Switch.Label :class="r.label + ' sample-label'">
            {{ item.label }}
          </Switch.Label>
          <p class="sample-description">{{ item.description }}</p>
        </div>
        <Switch.Control data-size="default" :class="r.switch">
          <Switch.Thumb :class="r['switch-thumb']" />
        </Switch.Control>
        <Switch.HiddenInput role="switch" />
      </Switch.Root>
      <!-- @source-end: switch -->
      <!-- @source-start: checkbox -->
      <Checkbox.Root
        v-else
        v-model:checked="focusedChecked[item.key]"
        :disabled="item.disabled"
        :class="'sample-row' + (item.disabled ? ' sample-disabled' : '')"
      >
        <Checkbox.Control :class="r.checkbox">
          <Checkbox.Indicator :class="r['checkbox-indicator']">
            <svg
              class="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </Checkbox.Indicator>
        </Checkbox.Control>
        <div class="demo-row-copy">
          <Checkbox.Label :class="r.label + ' sample-label'">
            {{ item.label }}
          </Checkbox.Label>
          <p class="sample-description">{{ item.description }}</p>
        </div>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <!-- @source-end: checkbox -->
    </template>
    <p class="sample-description sample-divider" role="status">
      {{ selectedCount }} of 3
      {{ example === 'switch' ? 'notifications enabled' : 'options selected' }}.

    </p>
  </div>
  <!-- @source-start: tabs -->
  <Tabs.Root
    v-else-if="example === 'tabs'"
    default-value="account"
    :class="r.tabs + ' simple-demo w-full'"
  >
    <Tabs.List :class="r['tabs-list'] + ' w-full'" data-variant="default">
      <Tabs.Trigger
        v-for="tab in tabExamples"
        :key="tab.value"
        :value="tab.value"
        :class="r['tabs-trigger']"
      >
        {{ tab.label }}
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content
      v-for="tab in tabExamples"
      :key="tab.value"
      :value="tab.value"
      :class="r['tabs-content']"
    >
      <div :class="r.card + ' sample-card'" data-slot="card">
        <div :class="r['card-header']">
          <div :class="r['card-title']">{{ tab.title }}</div>
          <div :class="r['card-description']">{{ tab.description }}</div>
        </div>
        <div :class="r['card-content']">
          <p class="sample-description">{{ tab.detail }}</p>
          <p class="sample-description sample-divider" role="status">
            {{ tab.status }}
          </p>
        </div>
      </div>
    </Tabs.Content>
  </Tabs.Root>
  <!-- @source-end: tabs -->
  <!-- @source-start: dialog -->
  <div
    v-else-if="example === 'dialog'"
    :class="r.card + ' simple-demo sample-card w-full'"
    data-slot="card"
  >
    <div :class="r['card-header']">
      <div :class="r['card-title']">Notification preferences</div>
      <div :class="r['card-description']">
        A little less noise. The updates that matter.
      </div>
    </div>
    <div :class="r['card-content']">
      <div class="sample-stack">
        <div class="sample-row">
          <span class="sample-label">Product updates</span>
          <span class="sample-description">On</span>
        </div>
        <div class="sample-row">
          <span class="sample-label">Marketing emails</span>
          <span class="sample-description">Off</span>
        </div>
        <div class="sample-row">
          <span class="sample-label">Helpful tips</span>
          <span class="sample-description">On</span>
        </div>
      </div>
    </div>
    <div :class="r['card-footer']">
      <Dialog.Root class="w-full">
        <Dialog.Trigger :class="r.button + ' w-full'">
          Review preferences
        </Dialog.Trigger>
        <Teleport to="body">
          <div
            data-design="shadcn"
            :class="dark ? 'dark' : ''"
            data-portal-owner="vue"
          >
            <Dialog.Backdrop :class="r['dialog-overlay']" />
            <Dialog.Positioner>
              <Dialog.Content
                data-demo-dialog="vue"
                :class="r['dialog-content']"
              >
                <div :class="r['dialog-header']">
                  <Dialog.Title :class="r['dialog-title']">
                    Your preferences
                  </Dialog.Title>
                  <Dialog.Description :class="r['dialog-description']">
                    Demo only. No settings are sent or stored.
                  </Dialog.Description>
                </div>
                <p class="text-sm">Marketing: off · Updates: on · Tips: on</p>
                <div :class="r['dialog-footer']">
                  <Dialog.CloseTrigger :class="r.button">
                    Done
                  </Dialog.CloseTrigger>
                </div>
              </Dialog.Content>
            </Dialog.Positioner>
          </div>
        </Teleport>
      </Dialog.Root>
    </div>
  </div>
  <!-- @source-end: dialog -->
  <Tabs.Root v-else default-value="notifications" :class="r.tabs + ' w-full'">
    <Tabs.List :class="r['tabs-list'] + ' w-full'" data-variant="default">
      <Tabs.Trigger value="notifications" :class="r['tabs-trigger']">
        Notifications
      </Tabs.Trigger>
      <Tabs.Trigger value="security" :class="r['tabs-trigger']">
        Security
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="notifications" :class="r['tabs-content']">
      <div :class="r.card" data-slot="card">
        <div :class="r['card-header']">
          <div :class="r['card-title']">Notifications</div>
          <div :class="r['card-description']">
            Choose what you want to hear about.
          </div>
        </div>
        <div :class="r['card-content'] + ' grid gap-6'">
          <Switch.Root v-model:checked="marketing" class="demo-row">
            <div class="demo-row-copy">
              <Switch.Label :class="r.label">Marketing emails</Switch.Label>
              <p class="demo-copy">News, offers, and product inspiration.</p>
            </div>
            <Switch.Control data-size="default" :class="r.switch">
              <Switch.Thumb :class="r['switch-thumb']" />
            </Switch.Control>
            <Switch.HiddenInput role="switch" />
          </Switch.Root>
          <Switch.Root v-model:checked="updates" class="demo-row">
            <div class="demo-row-copy">
              <Switch.Label :class="r.label">Product updates</Switch.Label>
              <p class="demo-copy">New features and improvements.</p>
            </div>
            <Switch.Control data-size="default" :class="r.switch">
              <Switch.Thumb :class="r['switch-thumb']" />
            </Switch.Control>
            <Switch.HiddenInput role="switch" />
          </Switch.Root>
          <Checkbox.Root
            v-model:checked="tips"
            class="flex items-center gap-3 border-t pt-5"
          >
            <Checkbox.Control :class="r.checkbox">
              <Checkbox.Indicator :class="r['checkbox-indicator']">
                <svg
                  class="size-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label :class="r.label">
              Include helpful tips
            </Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        </div>
        <div :class="r['card-footer']">
          <Dialog.Root class="w-full">
            <Dialog.Trigger :class="r.button + ' w-full'">
              Review preferences
            </Dialog.Trigger>
            <Teleport to="body">
              <div
                data-design="shadcn"
                :class="dark ? 'dark' : ''"
                data-portal-owner="vue"
              >
                <Dialog.Backdrop :class="r['dialog-overlay']" />
                <Dialog.Positioner>
                  <Dialog.Content
                    data-demo-dialog="vue"
                    :class="r['dialog-content']"
                  >
                    <div :class="r['dialog-header']">
                      <Dialog.Title :class="r['dialog-title']">
                        Your preferences
                      </Dialog.Title>
                      <Dialog.Description :class="r['dialog-description']">
                        Demo only. No settings are sent or stored.
                      </Dialog.Description>
                    </div>
                    <p class="text-sm">
                      Marketing: {{ marketing ? 'on' : 'off' }} · Updates:
                      {{ updates ? 'on' : 'off' }} · Tips:
                      {{ tips ? 'on' : 'off' }}
                    </p>
                    <div :class="r['dialog-footer']">
                      <Dialog.CloseTrigger :class="r.button">
                        Done
                      </Dialog.CloseTrigger>
                    </div>
                  </Dialog.Content>
                </Dialog.Positioner>
              </div>
            </Teleport>
          </Dialog.Root>
        </div>
      </div>
    </Tabs.Content>
    <Tabs.Content value="security" :class="r['tabs-content']">
      <div :class="r.card" data-slot="card">
        <div :class="r['card-header']">
          <div :class="r['card-title']">Security</div>
          <div :class="r['card-description']">
            Important alerts are always enabled.
          </div>
        </div>
        <div :class="r['card-content'] + ' grid gap-6'">
          <Switch.Root checked disabled class="demo-row">
            <Switch.Label :class="r.label">Security alerts</Switch.Label>
            <Switch.Control data-size="default" :class="r.switch">
              <Switch.Thumb :class="r['switch-thumb']" />
            </Switch.Control>
            <Switch.HiddenInput role="switch" />
          </Switch.Root>
          <Checkbox.Root checked disabled class="flex items-center gap-3">
            <Checkbox.Control :class="r.checkbox">
              <Checkbox.Indicator :class="r['checkbox-indicator']">
                <svg
                  class="size-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label :class="r.label">
              Required account notices
            </Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
          <p class="demo-notice">
            These controls demonstrate the disabled state.
          </p>
        </div>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</template>
