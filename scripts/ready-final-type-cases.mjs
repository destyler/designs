// Verify that the final controls' bounded APIs survive npm pack in each framework.
export function finalControlTypeCases(framework, importPath) {
  const shape = name => framework === 'vue' ? `InstanceType<typeof ${name}>['$props']` : `ComponentProps<typeof ${name}>`
  return `
import {ColorPicker,Signature,Timer} from '${importPath}';
import type {ColorPickerProps,SignatureProps,TimerProps} from '${importPath}';
type Color = ${shape('ColorPicker')};
type Draw = ${shape('Signature')};
type Clock = ${shape('Timer')};
const fieldShape:ColorPickerProps={label:'Accent',defaultValue:'#3155D9',presets:['#000000','#FFFFFF']};
const colorControl:Color={...fieldShape,onValueChange(hex){const value:string=hex}};
const padShape:SignatureProps={label:'Optional signature'};
const strokePad:Draw=padShape;
const timerShape:TimerProps={label:'Elapsed',startLabel:'Start timer',resetLabel:'Reset timer'};
const clock:Clock=timerShape;
// @ts-expect-error color input needs an accessible name
const noColorLabel:Color={defaultValue:'#3155D9'};
// @ts-expect-error controlled color uses canonical text, not a number
const badColorValue:Color={label:'Accent',value:3155};
// @ts-expect-error drawing input uses an explicit accessible name
const noPadLabel:Draw={};
// @ts-expect-error native form required semantics are not part of this optional pad
const requiredPad:Draw={label:'Optional signature',required:true};
// @ts-expect-error elapsed display needs an accessible name
const noTimerLabel:Clock={};
// @ts-expect-error countdown options are not part of the manual stopwatch profile
const countdownClock:Clock={label:'Elapsed',countdown:true};
`
}
