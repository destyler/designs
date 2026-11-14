import { validateAccessibleText } from '../accessible-text';
import { validateSelectOptions } from '../select-options';
import { useState, useId, useRef, useEffect, type ReactNode } from 'react';
import { Checkbox as C, Select as S, Dialog as D, createListCollection, useFieldContext, useSelectContext } from '@destyler-ui/react';
import type { CheckboxProps, SelectProps, DialogProps, Option } from '../types';
export function Checkbox(props: CheckboxProps) {
 validateAccessibleText(props.label, 'Checkbox', 'label');
 const [local, setLocal] = useState(false);
 const descriptionId=useId(); const errorId=useId(), field=useFieldContext(), container=useRef<HTMLDivElement>(null);
 const describedBy=[...new Set([field?.ariaDescribedby,props.description?.trim() ? descriptionId : undefined,props.error ? errorId : undefined].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ') || undefined;
 useEffect(()=>{container.current?.querySelector('input')?.setCustomValidity(props.error ?? '');},[props.error]);
 return <div ref={container} className="rd-component"><C.Root name={props.name} required={props.required} invalid={props.error ? true : (field?.invalid ?? false)} disabled={props.disabled} checked={props.checked ?? local} onCheckedChange={d => { const value=d.checked === true; setLocal(value); props.onCheckedChange?.(value); }}><C.Control aria-describedby={describedBy}><C.Indicator><span aria-hidden="true">✓</span></C.Indicator></C.Control><C.Label>{props.label}</C.Label><C.HiddenInput aria-describedby={describedBy} /></C.Root>{props.description?.trim() && <p id={descriptionId} className="rd-description">{props.description}</p>}{props.error && <p id={errorId} className="rd-error">{props.error}</p>}</div>;
}
// Preserve the primitive's requested reset baseline, but serialize only available options.
function HiddenSelect({value,options,describedBy}:{value:string;options:Option[];describedBy?:string}) {
 const api=useSelectContext(),field=useFieldContext(),element=useRef<HTMLSelectElement>(null);
 // Reconcile after each primitive snapshot commits, including its native selection writes.
 useEffect(()=>{const select=element.current;if(select?.isConnected){for(const option of select.options)option.selected=option.value===value;select.value=value;}},[api,value,options]);
 return <select ref={element} {...api.getHiddenSelectProps()} defaultValue={value} aria-describedby={describedBy ?? field?.ariaDescribedby}>{!value && <option value="" />}{options.map(item=><option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</select>;
}
export function Select(props: SelectProps) {
 validateAccessibleText(props.label, 'Select', 'label');
 validateAccessibleText(props.emptyMessage ?? 'No options available', 'Select', 'emptyMessage');
 const [local,setLocal]=useState(''); const requested=props.value ?? local;
 // Retain the requested key while async/missing options render an actual empty selection.
 const value=props.options.some(option=>option.value===requested) ? requested : '';
 const descriptionId=useId(); const emptyId=useId(); const errorId=useId(), field=useFieldContext();
 const describedBy=[...new Set([field?.ariaDescribedby,props.description?.trim() ? descriptionId : undefined,props.error ? errorId : undefined,props.options.length===0 ? emptyId : undefined].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ') || undefined;
 const container=useRef<HTMLDivElement>(null); const current=useRef(value);current.current=value;
 useEffect(()=>{container.current?.querySelector('select')?.setCustomValidity(props.error ?? '');},[props.error]);
 const sync=()=>{const input=container.current?.querySelector('select');if(input?.isConnected){for(const option of input.options)option.toggleAttribute('selected',option.value===current.current);input.value=current.current;}};
 useEffect(()=>{
  // The primitive can populate hidden options after this adapter's effect.
  const observer=new MutationObserver(sync);
  const target=container.current?.querySelector('select') ?? container.current;
  if(target)observer.observe(target,{childList:true,subtree:true});
  const timer=setTimeout(sync,0);
  return ()=>{clearTimeout(timer);observer.disconnect();};
 },[value,props.options]);
 const collection=createListCollection({items:validateSelectOptions(props.options)});
 return <div ref={container} className="rd-component"><S.Root name={props.name} required={props.required} invalid={props.error ? true : (field?.invalid ?? false)} disabled={props.disabled} collection={collection} value={requested ? [requested] : []} onValueChange={d=>{const next=d.value[0] ?? '';setLocal(next);props.onValueChange?.(next);setTimeout(sync,0);}}><S.Label>{props.label}</S.Label><S.Control><S.Trigger data-placeholder-shown={value ? undefined : ''} aria-describedby={describedBy} aria-required={props.required ?? field?.required}><S.ValueText><span>{props.options.find(option=>option.value===value)?.label ?? props.placeholder ?? 'Choose an option'}</span></S.ValueText><S.Indicator><span aria-hidden="true">⌄</span></S.Indicator></S.Trigger></S.Control>{props.description?.trim() && <p id={descriptionId} className="rd-description">{props.description}</p>}{props.options.length===0 && <p className="rd-empty" id={emptyId}>{props.emptyMessage ?? 'No options available'}</p>}<S.Positioner><S.Content>{props.options.map(option=><S.Item key={option.value} item={option}><S.ItemText>{option.label}</S.ItemText><S.ItemIndicator><span aria-hidden="true">✓</span></S.ItemIndicator></S.Item>)}</S.Content></S.Positioner><HiddenSelect value={value} options={props.options} describedBy={describedBy} /></S.Root>{props.error && <p id={errorId} className="rd-error">{props.error}</p>}</div>;
}
// Own the optional description link: the primitive only detects its presence when opening.
export function Dialog(props: DialogProps & { children?: ReactNode }) {
 validateAccessibleText(props.trigger, 'Dialog', 'trigger');
 validateAccessibleText(props.title, 'Dialog', 'title');
 validateAccessibleText(props.closeLabel ?? 'Close', 'Dialog', 'closeLabel');
 const [local,setLocal]=useState(false); const descriptionId=useId();
 return <div className="rd-component"><D.Root open={props.open ?? local} onOpenChange={d=>{setLocal(d.open);props.onOpenChange?.(d.open);}}><D.Trigger className="rd-button">{props.trigger}</D.Trigger><D.Backdrop /><D.Positioner><D.Content aria-describedby={props.description ? descriptionId : undefined}><D.Title>{props.title}</D.Title>{props.description && <D.Description id={descriptionId}>{props.description}</D.Description>}<div className="rd-dialog-body">{props.children}</div><D.CloseTrigger className="rd-button">{props.closeLabel ?? 'Close'}</D.CloseTrigger></D.Content></D.Positioner></D.Root></div>;
}
