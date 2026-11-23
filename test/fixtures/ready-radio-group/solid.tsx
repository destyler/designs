import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { RadioGroup } from '../../../packages/ready/solid/RadioGroup'
import { items } from './items'

function Fixture() {
  const [proposal, setProposal] = createSignal('')
  const [managed, setManaged] = createSignal<string | null>(null)
  return <form>
    <RadioGroup label="Schedule" items={items} name="schedule" defaultValue="daily" />
    <RadioGroup label="Record" items={items} name="record" required />
    <RadioGroup label="Fixed" items={items} name="fixed" value="daily" onValueChange={setProposal} />
    <RadioGroup label="Managed" items={items} name="managed" value={managed()} onValueChange={setManaged} />
    <RadioGroup label="Locked" items={items} name="locked" defaultValue="daily" disabled required />
    <span data-proposed>{proposal()}</span>
    <button type="button" onClick={() => setManaged(null)}>Clear managed</button>
  </form>
}

render(() => <Fixture />, document.querySelector('#app')!)
