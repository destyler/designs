<script lang="ts">
  import RadioGroup from '../../../packages/ready/svelte/RadioGroup.svelte'
  import { items } from './items'

  let proposal = $state('')
  let managed = $state<string | null>(null)
</script>

<form>
  <RadioGroup label="Schedule" {items} name="schedule" defaultValue="daily" />
  <RadioGroup label="Record" {items} name="record" required />
  <RadioGroup label="Fixed" {items} name="fixed" value="daily" onValueChange={value => proposal = value} />
  <RadioGroup label="Managed" {items} name="managed" value={managed} onValueChange={value => managed = value} />
  <RadioGroup label="Locked" {items} name="locked" defaultValue="daily" disabled required />
  <span data-proposed>{proposal}</span>
  <button type="button" onclick={() => managed = null}>Clear managed</button>
</form>
