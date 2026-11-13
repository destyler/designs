import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Checkbox as C, Select as S, Dialog as D, createListCollection } from '@destyler-ui/react';
import type { CheckboxProps, SelectProps, DialogProps } from '../types';
export function Checkbox(props: CheckboxProps) {
 const [local, setLocal] = useState(false);
 return <div className="rd-component"><C.Root name={props.name} disabled={props.disabled} checked={props.checked ?? local} onCheckedChange={d => { const value=d.checked === true; setLocal(value); props.onCheckedChange?.(value); }}><C.Control><C.Indicator><span aria-hidden="true">✓</span></C.Indicator></C.Control><C.Label>{props.label}</C.Label><C.HiddenInput /></C.Root></div>;
}
export function Select(props: SelectProps) {
 const [local,setLocal]=useState(''); const value=props.value ?? local;
 const container=useRef<HTMLDivElement>(null); const current=useRef(value);current.current=value;
 const sync=()=>{const input=container.current?.querySelector('select');if(input?.isConnected){for(const option of input.options)option.toggleAttribute('selected',option.value===current.current);input.value=current.current;}};
 useEffect(sync,[value,props.options]);
 const collection=createListCollection({items:props.options});
 return <div ref={container} className="rd-component"><S.Root name={props.name} disabled={props.disabled} collection={collection} value={value ? [value] : []} onValueChange={d=>{const next=d.value[0] ?? '';setLocal(next);props.onValueChange?.(next);setTimeout(sync,0);}}><S.Label>{props.label}</S.Label><S.Control><S.Trigger><S.ValueText placeholder={props.placeholder ?? 'Choose an option'} /><S.Indicator><span aria-hidden="true">⌄</span></S.Indicator></S.Trigger></S.Control><S.Positioner><S.Content>{props.options.map(option=><S.Item key={option.value} item={option}><S.ItemText>{option.label}</S.ItemText><S.ItemIndicator><span aria-hidden="true">✓</span></S.ItemIndicator></S.Item>)}</S.Content></S.Positioner><S.HiddenSelect /></S.Root></div>;
}
export function Dialog(props: DialogProps & { children?: ReactNode }) {
 const [local,setLocal]=useState(false);
 return <div className="rd-component"><D.Root open={props.open ?? local} onOpenChange={d=>{setLocal(d.open);props.onOpenChange?.(d.open);}}><D.Trigger className="rd-button">{props.trigger}</D.Trigger><D.Backdrop /><D.Positioner><D.Content><D.Title>{props.title}</D.Title>{props.description && <D.Description>{props.description}</D.Description>}<div className="rd-dialog-body">{props.children}</div><D.CloseTrigger className="rd-button">Close</D.CloseTrigger></D.Content></D.Positioner></D.Root></div>;
}
