<script setup lang="ts">
import { ref } from 'vue'
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from '@destyler-ui/vue'
import { NavigationMenu } from '@destyler-ui/vue'

const props = defineProps<NavigationMenuRootProps>()
const emits = defineEmits<NavigationMenuRootEmits>()
const selected = ref('')
</script>

<template>
  <main>
    <NavigationMenu.Root v-bind="props" @value-change="emits('valueChange', $event)" @update:model-value="emits('update:modelValue', $event)">
      <NavigationMenu.List>
        <NavigationMenu.Item value="getting-started">
          <NavigationMenu.Trigger value="getting-started">
            Getting started
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </NavigationMenu.Trigger>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="components">
          <NavigationMenu.Trigger value="components">
            Components
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </NavigationMenu.Trigger>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="docs">
          <NavigationMenu.Link value="docs" href="#" @click.prevent="selected = 'Documentation'">
            Documentation
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Indicator>
          <NavigationMenu.Arrow />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <NavigationMenu.ViewportPositioner>
        <NavigationMenu.Viewport>
          <NavigationMenu.Content value="getting-started">
            <ul>
              <li>
                <NavigationMenu.Link value="intro" href="#" @click.prevent="selected = 'Introduction'">
                  <div>Introduction</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="install" href="#" @click.prevent="selected = 'Installation'">
                  <div>Installation</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="typography" href="#" @click.prevent="selected = 'Typography'">
                  <div>Typography</div>

                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>

          <NavigationMenu.Content value="components">
            <ul>
              <li>
                <NavigationMenu.Link value="alert-dialog" href="#" @click.prevent="selected = 'Alert Dialog'">
                  <div>Alert Dialog</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="hover-card" href="#" @click.prevent="selected = 'Hover Card'">
                  <div>Hover Card</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="progress" href="#" @click.prevent="selected = 'Progress'">
                  <div>Progress</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="scroll-area" href="#" @click.prevent="selected = 'Scroll-area'">
                  <div>Scroll-area</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="tabs" href="#" @click.prevent="selected = 'Tabs'">
                  <div>Tabs</div>

                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link value="tooltip" href="#" @click.prevent="selected = 'Tooltip'">
                  <div>Tooltip</div>

                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Viewport>
      </NavigationMenu.ViewportPositioner>
    </NavigationMenu.Root><p role="status" class="parity-status">{{ selected || 'Choose a section' }}</p>
  </main>
</template>
