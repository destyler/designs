<script lang="ts">
  import type { SeparatorRootProps } from '@destyler-ui/svelte/separator'
  import { Separator } from '@destyler-ui/svelte/separator'

  const props: SeparatorRootProps = $props()
</script>

<main class="parity-stack" style="width:256px;">
  <div>
    <p>shadcn/ui</p>
    <p>Original New York components.</p>
  </div>
  <Separator.Root {...props} />
  <nav style="display: flex; align-items: center; gap: 16px; height:20px;">
    <span>Blog</span>
    <Separator.Root orientation="vertical" style="height: 20px;" />
    <span>Docs</span>
    <Separator.Root orientation="vertical" style="height: 20px;" />
    <span>Source</span>
  </nav>
</main>
