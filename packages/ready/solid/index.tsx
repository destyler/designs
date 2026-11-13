import { HiddenSelect } from './HiddenSelect';
import { validateSelectOptions } from '../select-options';
import { createSignal, createUniqueId, createMemo, createEffect, type JSX } from 'solid-js';
import { Checkbox as C, Select as S, Dialog as D, createListCollection } from '@destyler-ui/solid';
import type { CheckboxProps, SelectProps, DialogProps } from '../types';
export function Checkbox(props: CheckboxProps) {
 const [local, setLocal] = createSignal(false);
 return <div class="rd-component"><C.Root name={props.name} disabled={props.disabled} checked={props.checked ?? local()} onCheckedChange={d => { const value=d.checked === true; setLocal(value); props.onCheckedChange?.(value); }}><C.Control><C.Indicator><span aria-hidden="true">✓</span></C.Indicator></C.Control><C.Label>{props.label}</C.Label><C.HiddenInput /></C.Root></div>;
}
export function Select(props: SelectProps) {
 const [local,setLocal]=createSignal(''); const value=() => props.value ?? local();
 let container: HTMLDivElement | undefined;
 const sync=()=>{const input=container?.querySelector('select');if(input?.isConnected){for(const option of input.options)option.toggleAttribute('selected',option.value===value());input.value=value();}};
 createEffect(()=>{value();props.options.map(option=>option.value);queueMicrotask(sync);});
 const collection=createMemo(() => createListCollection({items:validateSelectOptions(props.options)}));
 return <div ref={container} class="rd-component"><S.Root name={props.name} disabled={props.disabled} collection={collection()} value={value() ? [value()] : []} onValueChange={d=>{const next=d.value[0] ?? '';setLocal(next);props.onValueChange?.(next);queueMicrotask(sync);}}><S.Label>{props.label}</S.Label><S.Control><S.Trigger><S.ValueText placeholder={props.placeholder ?? 'Choose an option'} /><S.Indicator><span aria-hidden="true">⌄</span></S.Indicator></S.Trigger></S.Control><S.Positioner><S.Content>{props.options.map(option=><S.Item item={option}><S.ItemText>{option.label}</S.ItemText><S.ItemIndicator><span aria-hidden="true">✓</span></S.ItemIndicator></S.Item>)}</S.Content></S.Positioner><HiddenSelect /></S.Root></div>;
}
// Own the optional description link: the primitive only detects its presence when opening.
export function Dialog(props: DialogProps & { children?: JSX.Element }) {
 const [local,setLocal]=createSignal(false); const descriptionId=createUniqueId();
 return <div class="rd-component"><D.Root open={props.open ?? local()} onOpenChange={d=>{setLocal(d.open);props.onOpenChange?.(d.open);}}><D.Trigger class="rd-button">{props.trigger}</D.Trigger><D.Backdrop /><D.Positioner><D.Content aria-describedby={props.description ? descriptionId : undefined}><D.Title>{props.title}</D.Title>{props.description && <D.Description id={descriptionId}>{props.description}</D.Description>}<div class="rd-dialog-body">{props.children}</div><D.CloseTrigger class="rd-button">Close</D.CloseTrigger></D.Content></D.Positioner></D.Root></div>;
}
