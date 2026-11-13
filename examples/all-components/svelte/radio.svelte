<script module lang="ts">
  import type { RadioRootProps } from '@destyler-ui/svelte/radio'

  export interface BasicProps extends RadioRootProps {}
</script>

<script lang="ts">
  import { Radio } from '@destyler-ui/svelte/radio'

  const props: BasicProps = $props()
  let value = $state('')
  const items = [
    { label: 'React', value: 'react' },
    { label: 'Solid', value: 'solid' },
    { label: 'Vue', value: 'vue' },
    { label: 'Svelte', value: 'svelte', disabled: true },
  ]
</script>

<Radio.Root bind:value {...props}>
  <Radio.Label>Framework</Radio.Label>
  {#each items as item (item.value)}
    <Radio.Item value={item.value} disabled={item.disabled}>
      <Radio.ItemControl />
      <Radio.ItemText>{item.label}</Radio.ItemText>
      <Radio.ItemHiddenInput />
    </Radio.Item>
  {/each}
<p role="status" class="parity-status">{value || 'No selection'}</p></Radio.Root>
