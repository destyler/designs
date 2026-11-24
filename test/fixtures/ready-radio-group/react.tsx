import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RadioGroup } from '../../../packages/ready/react/RadioGroup'
import { items } from './items'

function Fixture() {
  const [proposal, setProposal] = useState('')
  const [managed, setManaged] = useState<string | null>(null)
  return <form>
    <RadioGroup label="Schedule" items={items} name="schedule" defaultValue="daily" />
    <RadioGroup label="Record" items={items} name="record" required />
    <RadioGroup label="Fixed" items={items} name="fixed" value="daily" onValueChange={setProposal} />
    <RadioGroup label="Managed" items={items} name="managed" value={managed} onValueChange={setManaged} />
    <RadioGroup label="Locked" items={items} name="locked" defaultValue="daily" disabled required />
    <span data-proposed>{proposal}</span>
    <button type="button" onClick={() => setManaged(null)}>Clear managed</button>
  </form>
}

createRoot(document.querySelector('#app')!).render(<Fixture />)
