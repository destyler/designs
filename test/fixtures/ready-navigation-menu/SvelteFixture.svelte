<script lang="ts">
  import NavigationMenu from '../../../packages/ready/svelte/NavigationMenu.svelte'
  import { items, record } from './state'
</script>

<main>
  <NavigationMenu label="Main navigation" {items} onValueChange={record} />
  <button type="button" id="outside">Outside nav</button>
  <output data-values></output>
</main>
