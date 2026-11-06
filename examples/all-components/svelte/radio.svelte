<script module lang="ts">
  import type { RadioRootProps } from '@destyler-ui/svelte/radio'

  export interface BasicProps extends RadioRootProps {}
</script>

<script lang="ts">
  import { Radio } from '@destyler-ui/svelte/radio'

  const props: BasicProps = $props()
  const items = [
    { label: 'React', value: 'react' },
    { label: 'Solid', value: 'solid' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte', disabled: true },
  ]
</script>

<Radio.Root {...props}>
  <Radio.Label>Framework</Radio.Label>
  <Radio.Indicator />
  {#each items as item (item.value)}
    <Radio.Item value={item.value} disabled={item.disabled}>
      <Radio.ItemText>{item.label}</Radio.ItemText>
      <Radio.ItemControl />
      <Radio.ItemHiddenInput />
    </Radio.Item>
  {/each}
</Radio.Root>
