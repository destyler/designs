// Test the actual component prop surface from each packed framework entry.
export function overlayTypeCases(framework, importPath) {
  const shape = name => framework === 'vue' ? `InstanceType<typeof ${name}>['$props']` : `ComponentProps<typeof ${name}>`
  return `
import {Popover,Tooltip,HoverCard,Menu} from '${importPath}';
import type {PopoverProps,TooltipProps,HoverCardProps,MenuProps,MenuItem} from '${importPath}';
type Pop= ${shape('Popover')};
type Tip= ${shape('Tooltip')};
type Card= ${shape('HoverCard')};
type Actions= ${shape('Menu')};
const popShape:PopoverProps={trigger:'Open',title:'Details',open:false};
const tipShape:TooltipProps={trigger:'Info',text:'A descriptive hint'};
const cardShape:HoverCardProps={label:'Details',href:'/details',description:'Supplementary information'};
const actionItems:MenuItem[]=[{value:'copy',label:'Copy'},{value:'paste',label:'Paste',disabled:true}];
const actionShape:MenuProps={trigger:'Actions',items:actionItems};
const pop:Pop={...popShape,onOpenChange(open){const b:boolean=open}};
const tip:Tip=tipShape;
const card:Card=cardShape;
const actions:Actions={...actionShape,onSelect(value){const id:string=value}};
// @ts-expect-error a popover needs a title
const noPopoverTitle:Pop={trigger:'Open'};
// @ts-expect-error the open event carries a boolean
const wrongPopoverCallback:Pop={trigger:'Open',title:'Details',onOpenChange:(value:MouseEvent)=>{}};
// @ts-expect-error a tooltip trigger must be named
const noTooltipTrigger:Tip={text:'Help'};
// @ts-expect-error tooltip content is plain text
const wrongTooltipContent:Tip={trigger:'Info',text:5};
// @ts-expect-error a preview link needs a destination
const noCardHref:Card={label:'Details',description:'Supplementary information'};
// @ts-expect-error hover-card description is plain text
const wrongCardDescription:Card={label:'Details',href:'/details',description:5};
// @ts-expect-error a menu item needs a visible name
const noMenuItemLabel:Actions={trigger:'Actions',items:[{value:'copy'}]};
// @ts-expect-error selected action carries the item key
const wrongMenuCallback:Actions={trigger:'Actions',items:actionItems,onSelect:(value:boolean)=>{}};
`
}

// Verify each of the remaining workflow families and the toast controller are
// consumable without relying on the workspace aliases or raw UI types.
export function overlayWorkflowTypeCases(framework, importPath) {
  const shape = name => framework === 'vue' ? `InstanceType<typeof ${name}>['$props']` : `ComponentProps<typeof ${name}>`
  return `
import {FloatingPanel,Toast,Tour,createToastController} from '${importPath}';
import type {FloatingPanelProps,ToastProps,ToastController,ToastMessage,TourProps,TourStep,TourOutcome} from '${importPath}';
type Floater= ${shape('FloatingPanel')};
type Notify= ${shape('Toast')};
type Walkthrough= ${shape('Tour')};
const panel:FloatingPanelProps={trigger:'Inspector',title:'Inspector details'};
const moving:Floater={...panel,onOpenChange(open){const b:boolean=open}};
const notices:ToastController=createToastController();
const message:ToastMessage={title:'Saved',tone:'success',duration:6000};
const noticeId:string|undefined=notices.show(message);
const toastShape:ToastProps={controller:notices};
const toast:Notify=toastShape;
const sequence:TourStep[]=[{id:'welcome',title:'Welcome',description:'Sample walkthrough'}];
const tourShape:TourProps={label:'Tour',steps:sequence};
const tour:Walkthrough={...tourShape,onEnd(outcome){const result:TourOutcome=outcome}};
// @ts-expect-error standalone panel needs an accessible title
const noFloatingTitle:Floater={trigger:'Inspector'};
// @ts-expect-error panel disclosure is boolean
const badFloatingOpen:Floater={trigger:'Inspector',title:'Details',open:'yes'};
// @ts-expect-error the notification host requires a controller
const noToastController:Notify={};
// @ts-expect-error duration is a numeric millisecond value
notices.show({title:'Saved',duration:'6000'});
// @ts-expect-error tour steps need readable descriptive content
const noTourDescription:Walkthrough={label:'Tour',steps:[{id:'welcome',title:'Welcome'}]};
// @ts-expect-error tour reports an explicit textual outcome, not a boolean
const badTourEnd:Walkthrough={...tourShape,onEnd:(outcome:boolean)=>{}};
`
}
