<script setup lang="ts">
import { ScrollArea } from '@destyler-ui/vue'

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
)
</script>

<template>
  <main>
    <ScrollArea.Root style="width: 208px; height: 288px; border: 1px solid var(--border); border-radius: 6px;">
      <ScrollArea.Viewport>
        <ScrollArea.Content>
          <div style="padding: 16px; min-width: 256px;">
            <h3 style="margin: 0 0 12px 0;">Tags</h3>
            <div v-for="tag in tags" :key="tag" style="padding: 8px 0; border-bottom: 1px solid var(--border);">
              {{ tag }}
            </div>
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>

      <ScrollArea.Scrollbar orientation="vertical" style="width: 8px; background: transparent;">
        <ScrollArea.Thumb orientation="vertical" style="background: var(--border); border-radius: 4px;" />
      </ScrollArea.Scrollbar>

      <ScrollArea.Scrollbar orientation="horizontal" style="height: 8px; background: transparent;">
        <ScrollArea.Thumb orientation="horizontal" style="background: var(--border); border-radius: 4px;" />
      </ScrollArea.Scrollbar>

      <ScrollArea.Corner style="background: transparent;" />
    </ScrollArea.Root>
  </main>
</template>
