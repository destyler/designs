<script lang="ts">
  import { Progress } from '@destyler-ui/svelte/progress'
  let value = $state(65)
</script>
<Progress.Root {value} class="parity-stack">
  <Progress.Label>Label <span role="status">{value}%</span></Progress.Label>
  <Progress.Track><Progress.Range /></Progress.Track>
  <button type="button" class="parity-button" onclick={() => value = value >= 100 ? 0 : Math.min(100, value + 10)}>Advance</button>
</Progress.Root>
