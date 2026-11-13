import { validateSelectOptions } from '../select-options';
import { useState, useId, useRef, useEffect, type ReactNode } from 'react';
import { Checkbox as C, Select as S, Dialog as D, createListCollection, useFieldContext } from '@destyler-ui/react';
import type { CheckboxProps, SelectProps, DialogProps } from '../types';
export function Checkbox(props: CheckboxProps) {
 const [local, setLocal] = useState(false);
 const errorId=useId(), field=useFieldContext(), container=useRef<HTMLDivElement>(null);
 const describedBy=[field?.ariaDescribedby,props.error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
 useEffect(()=>{container.current?.querySelector('input')?.setCustomValidity(props.error ?? '');},[props.error]);
 return <div ref={container} className="rd-component"><C.Root name={props.name} required={props.required} invalid={props.error ? true : (field?.invalid ?? false)} disabled={props.disabled} checked={props.checked ?? local} onCheckedChange={d => { const value=d.checked === true; setLocal(value); props.onCheckedChange?.(value); }}><C.Control><C.Indicator><span aria-hidden="true">✓</span></C.Indicator></C.Control><C.Label>{props.label}</C.Label><C.HiddenInput aria-describedby={describedBy} /></C.Root>{props.error && <p id={errorId} className="rd-error">{props.error}</p>}</div>;
}
export function Select(props: SelectProps) {
 const [local,setLocal]=useState(''); const requested=props.value ?? local;
 // Retain the requested key while async/missing options render an actual empty selection.
 const value=props.options.some(option=>option.value===requested) ? requested : '';
 const errorId=useId(), field=useFieldContext();
 const describedBy=[field?.ariaDescribedby,props.error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
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
 return <div ref={container} className="rd-component"><S.Root name={props.name} required={props.required} invalid={props.error ? true : (field?.invalid ?? false)} disabled={props.disabled} collection={collection} value={value ? [value] : []} onValueChange={d=>{const next=d.value[0] ?? '';setLocal(next);props.onValueChange?.(next);setTimeout(sync,0);}}><S.Label>{props.label}</S.Label><S.Control><S.Trigger aria-describedby={describedBy} aria-required={props.required ?? field?.required}><S.ValueText placeholder={props.placeholder ?? 'Choose an option'} /><S.Indicator><span aria-hidden="true">⌄</span></S.Indicator></S.Trigger></S.Control><S.Positioner><S.Content>{props.options.map(option=><S.Item key={option.value} item={option}><S.ItemText>{option.label}</S.ItemText><S.ItemIndicator><span aria-hidden="true">✓</span></S.ItemIndicator></S.Item>)}</S.Content></S.Positioner><S.HiddenSelect aria-describedby={describedBy} /></S.Root>{props.error && <p id={errorId} className="rd-error">{props.error}</p>}</div>;
}
// Own the optional description link: the primitive only detects its presence when opening.
export function Dialog(props: DialogProps & { children?: ReactNode }) {
 const [local,setLocal]=useState(false); const descriptionId=useId();
 return <div className="rd-component"><D.Root open={props.open ?? local} onOpenChange={d=>{setLocal(d.open);props.onOpenChange?.(d.open);}}><D.Trigger className="rd-button">{props.trigger}</D.Trigger><D.Backdrop /><D.Positioner><D.Content aria-describedby={props.description ? descriptionId : undefined}><D.Title>{props.title}</D.Title>{props.description && <D.Description id={descriptionId}>{props.description}</D.Description>}<div className="rd-dialog-body">{props.children}</div><D.CloseTrigger className="rd-button">Close</D.CloseTrigger></D.Content></D.Positioner></D.Root></div>;
}
