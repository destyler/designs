import { render } from 'solid-js/web'
import { Switch } from '../../../packages/ready/solid'

const update = (checked: boolean) => {
  document.querySelector('[data-proposed]')!.textContent = String(checked)
}
render(() => <form>
  <Switch label="Airplane mode" description="Turns radios off" name="radios" value="off" defaultChecked />
  <Switch label="Fixed" name="fixed" checked={false} onCheckedChange={update} />
  <Switch label="Disabled" name="disabled" defaultChecked disabled />
  <Switch label="Consent" name="consent" required />
  <Switch label="Invalid" name="invalid" error="Check the setting" />
  <span data-proposed />
</form>, document.querySelector('#app')!)
