<script setup lang="ts">
import Carousel from '../../../packages/ready/vue/Carousel.vue'
import { items, record } from './state'
</script>

<template>
  <main>
    <Carousel label="Stories" :items="items" @page-change="record">
      <template #slide="{ item, index }">
        <a :href="`#item-${index}`">{{ item.content }}</a>
      </template>
    </Carousel>
    <Carousel label="Single" :items="items.slice(0, 1)" />
    <Carousel label="Empty" :items="[]" />
    <output data-pages />
  </main>
</template>
