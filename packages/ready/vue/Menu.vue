<script setup lang="ts">
import { computed, useId } from 'vue'
import { Menu as Primitive } from '@destyler-ui/vue'
import { allowMenuTab, emitMenuSelection, matchMenuClick, menuPosition, prepareMenu, preserveMenuOutsideFocus, type MenuProps } from '../Menu'

const props = defineProps<Omit<MenuProps, 'onSelect' | 'onOpenChange'>>()
const emit = defineEmits<{ select: [value: string]; openChange: [open: boolean] }>()
const id = useId()
const entries = computed(() => prepareMenu(props.trigger, props.items, id))
</script>

<template>
  <Primitive.Root :positioning="menuPosition" close-on-select loop-focus
    @select="emitMenuSelection(entries, $event.value, value => emit('select', value))"
    @open-change="emit('openChange', $event.open)" @focus-outside="preserveMenuOutsideFocus">
    <Primitive.Context v-slot="api">
      <div class="rd-component rd-menu" @click.capture="matchMenuClick($event, api)" @keydown.capture="allowMenuTab">
        <Primitive.Trigger :disabled="entries.every(item => item.disabled)">
          {{ trigger }}<span aria-hidden="true">⌄</span>
        </Primitive.Trigger>
        <Primitive.Positioner>
          <Primitive.Content>
            <Primitive.Item v-for="item in entries" :key="item.id" :value="item.id" :value-text="item.label" :disabled="item.disabled">
              {{ item.label }}
            </Primitive.Item>
          </Primitive.Content>
        </Primitive.Positioner>
      </div>
    </Primitive.Context>
  </Primitive.Root>
</template>
