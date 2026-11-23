<script setup lang="ts">
import NavigationMenu from '../../../packages/ready/vue/NavigationMenu.vue'
import { items, record } from './state'
</script>

<template>
  <main>
    <NavigationMenu label="Main navigation" :items="items" @value-change="record" />
    <button type="button" id="outside">Outside nav</button>
    <output data-values />
  </main>
</template>
