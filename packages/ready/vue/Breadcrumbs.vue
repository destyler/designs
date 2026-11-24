<script setup lang="ts">
import { computed } from 'vue'
import { Breadcrumbs as Primitive } from '@destyler-ui/vue'
import { prepareBreadcrumbs } from '../Breadcrumbs'
import type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

const props = withDefaults(defineProps<BreadcrumbsProps>(), { label: 'Breadcrumb', separator: '/' })
const emit = defineEmits<{ navigate: [event: MouseEvent, item: BreadcrumbsItem] }>()
const trail = computed(() => prepareBreadcrumbs(props.items))
</script>

<template>
  <div class="rd-component">
    <Primitive.Root :items="trail" :aria-label="label">
      <Primitive.List>
        <Primitive.Item v-for="(item, index) in trail" :key="item.id" :item="item" :aria-label="undefined">
          <Primitive.Separator v-if="index > 0">{{ separator }}</Primitive.Separator>
          <Primitive.Link :item="item" @click="item.href && emit('navigate', $event, item.source)">
            {{ item.label }}
          </Primitive.Link>
        </Primitive.Item>
      </Primitive.List>
    </Primitive.Root>
  </div>
</template>
