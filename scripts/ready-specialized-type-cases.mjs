// Verify the four composed public boundaries from the packed source entry.
export function specializedTypeCases(framework, importPath) {
  const shape = name => framework === 'vue' ? `InstanceType<typeof ${name}>['$props']` : `ComponentProps<typeof ${name}>`
  return `
import {Clipboard,Edit,QRCode,ToggleGroup} from '${importPath}';
import type {ClipboardProps,EditProps,QRCodeProps,ToggleGroupProps,ToggleGroupItem} from '${importPath}';
type Copy= ${shape('Clipboard')};
type InlineEdit= ${shape('Edit')};
type Code= ${shape('QRCode')};
type PressedGroup= ${shape('ToggleGroup')};
const copyShape:ClipboardProps={label:'Link',value:'https://example.test'};
const copy:Copy=copyShape;
const editShape:EditProps={label:'Title',defaultValue:'Draft',maxLength:40};
const inlineEdit:InlineEdit={...editShape,onValueCommit(value){const title:string=value}};
const codeShape:QRCodeProps={label:'Documentation QR code',value:'https://example.test',size:192};
const qr:Code=codeShape;
const groupItems:ToggleGroupItem[]=[{value:'bold',label:'Bold'},{value:'italic',label:'Italic',disabled:true}];
const groupShape:ToggleGroupProps={label:'Formatting',items:groupItems,orientation:'horizontal',defaultValue:['bold']};
const pressedGroup:PressedGroup={...groupShape,onValueChange(values){const ids:string[]=values}};
// @ts-expect-error clipboard source must be visible and named
const noClipboardLabel:Copy={value:'sample'};
// @ts-expect-error clipboard source is single-line text, not a numeric value
const wrongClipboardValue:Copy={label:'Link',value:5};
// @ts-expect-error inline edit requires a visible name
const noEditLabel:InlineEdit={defaultValue:'Draft'};
// @ts-expect-error edit commit carries the saved string rather than an event
const wrongEditCallback:InlineEdit={label:'Title',onValueCommit:(event:Event)=>{}};
// @ts-expect-error SVG image requires a meaningful explicit label
const noCodeLabel:Code={value:'Sample'};
// @ts-expect-error requested size uses a numeric CSS pixel value
const wrongCodeSize:Code={label:'Sample',value:'Sample',size:'192'};
// @ts-expect-error group uses an array of independent pressed values
const wrongGroupValue:PressedGroup={label:'Formatting',items:groupItems,value:'bold'};
// @ts-expect-error group requires an explicit text label on every button
const noGroupItemLabel:PressedGroup={label:'Formatting',items:[{value:'bold'}]};
`
}
