<script setup lang="ts">
import { Collapse } from '@destyler-ui/vue'
import { ref } from 'vue'

const items = ref(['React', 'Solid', 'Svelte', 'Vue'])
</script>

<template>
  <Collapse.Root :defaultValue="['Vue']" collapsible>
    <Collapse.Item v-for="item in items" :key="item" :value="item" :disabled="item === 'Svelte'">
      <Collapse.ItemTrigger>
        {{ item }} trigger
        <Collapse.ItemIndicator />
      </Collapse.ItemTrigger>
      <Collapse.ItemContent>
        <div>{{ item }} Content</div>
      </Collapse.ItemContent>
    </Collapse.Item>
  </Collapse.Root>
</template>
