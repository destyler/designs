<script lang="ts">
  import { Switch } from '../../../packages/ready/svelte'
  let proposed = $state('')
</script>

<form>
  <Switch label="Airplane mode" description="Turns radios off" name="radios" value="off" defaultChecked />
  <Switch label="Fixed" name="fixed" checked={false} onCheckedChange={checked => { proposed = String(checked) }} />
  <Switch label="Disabled" name="disabled" defaultChecked disabled />
  <Switch label="Consent" name="consent" required />
  <Switch label="Invalid" name="invalid" error="Check the setting" />
  <span data-proposed>{proposed}</span>
</form>
