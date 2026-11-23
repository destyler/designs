<script setup lang="ts">
import { computed } from 'vue'
import { NavigationMenu as Primitive } from '@destyler-ui/vue'
import { navigationEscape, navigationFocusOut, navigationLinkClick, navigationLinkKeys, navigationTriggerDirection, prepareNavigationMenu, type NavigationMenuProps } from '../NavigationMenu'

const props = defineProps<Omit<NavigationMenuProps, 'onValueChange'>>()
const emit = defineEmits<{ valueChange: [value: string | null] }>()
const entries = computed(() => prepareNavigationMenu(props.label, props.items))
</script>

<template>
  <Primitive.Root class="rd-component rd-navigation-menu" :aria-label="label" disable-hover-trigger disable-pointer-leave-close
    @value-change="emit('valueChange', $event.value)">
    <Primitive.Context v-slot="api">
      <Primitive.List role="list" @keydown.capture="navigationTriggerDirection($event, api)" @keydown="navigationEscape($event, api)" @focusout="navigationFocusOut($event, api)">
        <Primitive.Item v-for="item in entries" :key="item.id" :value="item.id" role="listitem">
          <a v-if="'href' in item" :href="item.href" :aria-current="item.current ? 'page' : undefined"
            @click="navigationLinkClick($event, api)" @keydown="navigationLinkKeys">{{ item.label }}</a>
          <template v-else>
            <Primitive.Trigger :value="item.id" :disabled="item.disabled">
              {{ item.label }}<span aria-hidden="true">⌄</span>
            </Primitive.Trigger>
            <Primitive.Content :value="item.id">
              <ul class="rd-navigation-menu-panel-links" role="list">
                <li v-for="link in item.links" :key="link.id">
                  <a :href="link.href" :aria-current="link.current ? 'page' : undefined"
                    @click="navigationLinkClick($event, api)" @keydown="navigationLinkKeys">{{ link.label }}</a>
                </li>
              </ul>
            </Primitive.Content>
          </template>
        </Primitive.Item>
      </Primitive.List>
    </Primitive.Context>
  </Primitive.Root>
</template>
