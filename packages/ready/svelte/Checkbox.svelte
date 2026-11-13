<script lang="ts">
  import { validateAccessibleText } from '../accessible-text'
  import { useFieldContext } from '@destyler-ui/svelte/field'
  import { Checkbox } from '@destyler-ui/svelte/checkbox'
  let { label, checked, name, required, error, disabled, onCheckedChange }: { label: string; checked?: boolean; name?: string; required?: boolean; error?: string; disabled?: boolean; onCheckedChange?: (value: boolean) => void } = $props()
  let local = $state(false)
  let element:HTMLDivElement
  const errorId=$props.id();const field=useFieldContext()
  const describedBy=$derived([field?.()?.ariaDescribedby,error?errorId:undefined].filter(Boolean).join(' ')||undefined)
  $effect(()=>{element?.querySelector('input')?.setCustomValidity(error??'')})
  const accessibleLabel=$derived(validateAccessibleText(label,'Checkbox','label'))
</script>
<div bind:this={element} class="rd-component"><Checkbox.Root {required} invalid={error?true:(field?.()?.invalid??false)} checked={checked ?? local} {name} {disabled} onCheckedChange={details => { local = details.checked === true; onCheckedChange?.(local) }}>
  <Checkbox.Control><Checkbox.Indicator><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6" /></svg></Checkbox.Indicator></Checkbox.Control><Checkbox.Label>{accessibleLabel}</Checkbox.Label><Checkbox.HiddenInput aria-describedby={describedBy} />
</Checkbox.Root>{#if error}<span id={errorId} class="rd-error">{error}</span>{/if}</div>
