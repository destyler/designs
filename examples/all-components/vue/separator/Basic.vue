<script setup lang="ts">
import { Separator } from '@destyler-ui/vue'
</script>

<template>
  <main class="parity-stack" style="width:256px;">
    <div>
      <p>shadcn/ui</p>
      <p>Original New York components.</p>
    </div>
    <Separator.Root />
    <nav style="display:flex;align-items:center;gap:16px;height:20px;">
      <span>Blog</span>
      <Separator.Root orientation="vertical" />
      <span>Docs</span>
      <Separator.Root orientation="vertical" />
      <span>Source</span>
    </nav>
  </main>
</template>
