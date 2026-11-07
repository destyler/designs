<script lang="ts">
  import type { SplitterRootProps } from '@destyler-ui/svelte/splitter'
  import { Splitter } from '@destyler-ui/svelte/splitter'

  let { ...props }: SplitterRootProps = $props()
</script>

<Splitter.Root
  defaultSize={[
    { id: 'a', size: 50 },
    { id: 'b', size: 50 },
  ]}
  {...props}
>
  <Splitter.Panel id="a">A</Splitter.Panel>
  <Splitter.ResizeTrigger id="a:b" aria-label="Resize A and B panels"><div class="bar"></div></Splitter.ResizeTrigger>
  <Splitter.Panel id="b">B</Splitter.Panel>
</Splitter.Root>
