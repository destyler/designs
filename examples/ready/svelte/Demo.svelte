<script lang="ts">
  import { Checkbox, Select, Dialog } from '../../../packages/ready/svelte'
  let checked = $state(false), value = $state(''), open = $state(false)
  const options = [{ label: 'Starter', value: 'starter' }, { label: 'Studio', value: 'studio' }, { label: 'Enterprise', value: 'enterprise', disabled: true }]
</script>
<div class="rd-demo"><Checkbox name="updates" label="Email me product updates" {checked} onCheckedChange={next => checked = next} /><Select name="plan" label="Workspace plan" {options} {value} onValueChange={next => value = next} /><Dialog trigger="Review settings" title="Your workspace" description="Your choices stay with you when the theme changes." {open} onOpenChange={next => open = next}><p>Plan: {value || 'Not selected'}</p><p>Updates: {checked ? 'Enabled' : 'Disabled'}</p></Dialog><p role="status">{checked ? 'Updates enabled' : 'Updates disabled'} · {value || 'No plan selected'}</p></div>
