<script setup lang="ts">
import FileUpload from '../../../packages/ready/vue/FileUpload.vue'
import { record } from './state'
</script>

<template>
  <form>
    <FileUpload label="Attachments" :accept="['.txt']" :max-files="2" :max-file-size="8" @files-change="record" />
    <FileUpload label="Locked" trigger-label="Add file" disabled />
    <output data-files />
  </form>
</template>
