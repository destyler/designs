<script lang="ts">
  import { Checkbox } from '@destyler-ui/svelte/checkbox'
  let { label, checked, name, disabled = false, onCheckedChange }: { label: string; checked?: boolean; name?: string; disabled?: boolean; onCheckedChange?: (value: boolean) => void } = $props()
  let local = $state(false)
</script>
<div class="rd-component"><Checkbox.Root checked={checked ?? local} {name} {disabled} onCheckedChange={details => { local = details.checked === true; onCheckedChange?.(local) }}>
  <Checkbox.Control><Checkbox.Indicator><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6" /></svg></Checkbox.Indicator></Checkbox.Control><Checkbox.Label>{label}</Checkbox.Label><Checkbox.HiddenInput />
</Checkbox.Root></div>
