<script lang="ts">
  import Menu from '../../../packages/ready/svelte/Menu.svelte'
  import { items, record } from './state'
</script>

<main>
  <Menu trigger="Actions" {items} onSelect={value => record('A', value)} onOpenChange={open => record('open', open)} />
  <button type="button" id="outside">Outside</button>
  <Menu trigger="Other actions" {items} onSelect={value => record('B', value)} />
  <Menu trigger="No actions" items={[]} />
  <output data-results></output>
</main>
