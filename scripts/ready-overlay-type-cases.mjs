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
