import { validateAccessibleText } from '../accessible-text';
import { HiddenSelect } from './HiddenSelect';
import { validateSelectOptions } from '../select-options';
import { createSignal, createUniqueId, createMemo, createEffect, type JSX } from 'solid-js';
import { Checkbox as C, Select as S, Dialog as D, createListCollection, useFieldContext } from '@destyler-ui/solid';
import type { CheckboxProps, SelectProps, DialogProps } from '../types';
export function Checkbox(props: CheckboxProps) {
 const label=createMemo(()=>validateAccessibleText(props.label,'Checkbox','label'));
 const [local, setLocal] = createSignal(false);
 const errorId=createUniqueId();const descriptionId=`${errorId}-description`;const hasDescription=()=>!!props.description?.trim();const field=useFieldContext();let container:HTMLDivElement|undefined;
 const describedBy=()=>[...new Set([field?.().ariaDescribedby,hasDescription()?descriptionId:undefined,props.error?errorId:undefined].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ')||undefined;
 createEffect(()=>{const error=props.error??'';container?.querySelector('input')?.setCustomValidity(error)});
 return <div ref={container} class="rd-component"><C.Root required={props.required} invalid={props.error?true:(field?.().invalid??false)} name={props.name} disabled={props.disabled} checked={props.checked ?? local()} onCheckedChange={d => { const value=d.checked === true; setLocal(value); props.onCheckedChange?.(value); }}><C.Control aria-describedby={describedBy()}><C.Indicator><span aria-hidden="true">✓</span></C.Indicator></C.Control><C.Label>{label()}</C.Label><C.HiddenInput aria-describedby={describedBy()} /></C.Root>{hasDescription() && <p id={descriptionId} class="rd-description">{props.description}</p>}{props.error && <span id={errorId} class="rd-error">{props.error}</span>}</div>;
}
export function Select(props: SelectProps) {
 const emptyMessage=createMemo(()=>validateAccessibleText(props.emptyMessage ?? 'No options available','Select','emptyMessage'));
 const emptyId=createUniqueId();
 const label=createMemo(()=>validateAccessibleText(props.label,'Select','label'));
 const [local,setLocal]=createSignal(''); const requested=() => props.value ?? local();
 // Keep the primitive requested value as its reset baseline; normalize only the native control.
 const value=() => props.options.some(option=>option.value===requested()) ? requested() : '';
 let container: HTMLDivElement | undefined;
 const errorId=createUniqueId();const descriptionId=`${errorId}-description`;const hasDescription=()=>!!props.description?.trim();const field=useFieldContext();const describedBy=()=>[...new Set([field?.().ariaDescribedby,hasDescription()?descriptionId:undefined,props.error?errorId:undefined,props.options.length===0?emptyId:undefined].filter(Boolean).join(' ').split(/\s+/).filter(Boolean))].join(' ')||undefined;
 createEffect(()=>{const error=props.error??'';container?.querySelector('select')?.setCustomValidity(error)});
 const sync=()=>{const input=container?.querySelector('select');if(input?.isConnected){for(const option of input.options)option.toggleAttribute('selected',option.value===value());input.value=value();}};
 createEffect(()=>{value();props.options.map(option=>option.value);queueMicrotask(sync);});
 const collection=createMemo(() => createListCollection({items:validateSelectOptions(props.options)}));
 return <div ref={container} class="rd-component"><S.Root required={props.required} invalid={props.error?true:(field?.().invalid??false)} name={props.name} disabled={props.disabled} collection={collection()} value={requested() ? [requested()] : []} onValueChange={d=>{const next=d.value[0] ?? '';setLocal(next);props.onValueChange?.(next);queueMicrotask(sync);}}><S.Label>{label()}</S.Label><S.Control><S.Trigger data-placeholder-shown={value()?undefined:''} aria-required={(props.required??field?.().required)||undefined} aria-describedby={describedBy()}><S.ValueText placeholder={props.placeholder ?? 'Choose an option'} /><S.Indicator><span aria-hidden="true">⌄</span></S.Indicator></S.Trigger></S.Control>{hasDescription() && <p id={descriptionId} class="rd-description">{props.description}</p>}{props.options.length===0 && <span id={emptyId} class="rd-empty">{emptyMessage()}</span>}<S.Positioner><S.Content>{props.options.map(option=><S.Item item={option}><S.ItemText>{option.label}</S.ItemText><S.ItemIndicator><span aria-hidden="true">✓</span></S.ItemIndicator></S.Item>)}</S.Content></S.Positioner><HiddenSelect descriptionId={hasDescription()?descriptionId:undefined} emptyId={props.options.length===0?emptyId:undefined} errorId={props.error?errorId:undefined} invalid={props.error?true:(field?.().invalid??false)} /></S.Root>{props.error && <span id={errorId} class="rd-error">{props.error}</span>}</div>;
}
// Own the optional description link: the primitive only detects its presence when opening.
export function Dialog(props: DialogProps & { children?: JSX.Element }) {
 const closeLabel=createMemo(()=>validateAccessibleText(props.closeLabel ?? 'Close','Dialog','closeLabel'));
 const trigger=createMemo(()=>validateAccessibleText(props.trigger,'Dialog','trigger'));
 const title=createMemo(()=>validateAccessibleText(props.title,'Dialog','title'));
 const [local,setLocal]=createSignal(false); const descriptionId=createUniqueId();
 return <div class="rd-component"><D.Root open={props.open ?? local()} onOpenChange={d=>{setLocal(d.open);props.onOpenChange?.(d.open);}}><D.Trigger class="rd-button">{trigger()}</D.Trigger><D.Backdrop /><D.Positioner><D.Content aria-describedby={props.description ? descriptionId : undefined}><D.Title>{title()}</D.Title>{props.description && <D.Description id={descriptionId}>{props.description}</D.Description>}<div class="rd-dialog-body">{props.children}</div><D.CloseTrigger class="rd-button">{closeLabel()}</D.CloseTrigger></D.Content></D.Positioner></D.Root></div>;
}
