<script setup lang="ts">
import Menu from '../../../packages/ready/vue/Menu.vue'
import { items, record } from './state'
</script>

<template>
  <main>
    <Menu trigger="Actions" :items="items" @select="record('A', $event)" @open-change="record('open', $event)" />
    <button type="button" id="outside">Outside</button>
    <Menu trigger="Other actions" :items="items" @select="record('B', $event)" />
    <Menu trigger="No actions" :items="[]" />
    <output data-results />
  </main>
</template>
