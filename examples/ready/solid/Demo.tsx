import { createSignal } from 'solid-js';
import { Checkbox, Select, Dialog } from '../../../packages/ready/solid';
export function Demo() {
 const [checked,setChecked]=createSignal(false),[value,setValue]=createSignal('');
 return <><Checkbox label="Email me product updates" name="updates" checked={checked()} onCheckedChange={setChecked}/><Checkbox label="Unavailable preference" disabled/><Select name="workspace" label="Workspace" placeholder="Choose a workspace" options={[{label:'Personal',value:'personal'},{label:'Studio',value:'studio'},{label:'Enterprise (unavailable)',value:'enterprise',disabled:true}]} value={value()} onValueChange={setValue}/><p role="status">Updates: {checked() ? 'on':'off'} · Workspace: {value() || 'none'}</p><Dialog trigger="Review settings" title="Your workspace, your way" description="These composed controls share one small theme contract."><p>No primitive assembly is required by the consumer.</p></Dialog></>;
}
