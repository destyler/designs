<script setup lang="ts">
import Toast from '../../../packages/ready/vue/Toast.vue'
import { controller } from './state'
</script>

<template>
  <main><button id="outside" type="button">Outside</button>
    <Toast :controller="controller" label="Activity" /><button id="after" type="button">After</button></main>
</template>
