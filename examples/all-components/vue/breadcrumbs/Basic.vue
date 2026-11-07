<script setup lang="ts">
import { ref } from 'vue'
import { Breadcrumbs } from '@destyler-ui/vue'

const selected = ref('Smartphones')
const items = [
  { id: '1', label: 'Home', href: '/' },
  { id: '2', label: 'Products', href: '/products' },
  { id: '3', label: 'Electronics', href: '/products/electronics' },
  { id: '4', label: 'Smartphones' },
]
</script>

<template>
  <main class="parity-stack">
    <Breadcrumbs.Root :items="items">
      <Breadcrumbs.List>
        <Breadcrumbs.Context v-slot="breadcrumbs">
          <Breadcrumbs.Item v-for="item in breadcrumbs.items" :key="item.id" :item="item">
            <Breadcrumbs.Link :item="item" @click.prevent="selected = item.label">{{ item.label }}</Breadcrumbs.Link>
            <Breadcrumbs.Separator v-if="item.href">›</Breadcrumbs.Separator>
          </Breadcrumbs.Item>
        </Breadcrumbs.Context>
      </Breadcrumbs.List>
    </Breadcrumbs.Root><p role="status" class="parity-status">Selected: {{ selected }}</p>
  </main>
</template>
