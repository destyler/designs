<script lang="ts">
  import { examples, type Family } from './registry'
  let { family = 'checkbox' }: { family?: Family } = $props()
  const Example = $derived(examples[family])
</script>
<Example />
