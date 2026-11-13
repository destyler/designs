<script setup lang="ts">
import { Splitter } from '@destyler-ui/vue'
</script>
<template>
  <Splitter.Root :default-size="[{ id: 'a', size: 50 }, { id: 'b', size: 50 }]">
    <Splitter.Panel id="a">A</Splitter.Panel>
    <Splitter.ResizeTrigger id="a:b" aria-label="Resize A and B panels">
      <div class="bar"></div>
    </Splitter.ResizeTrigger>
    <Splitter.Panel id="b">B</Splitter.Panel>
  </Splitter.Root>
</template>
