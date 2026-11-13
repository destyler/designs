import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
const css=await readFile(new URL('../packages/ready/theme.css',import.meta.url),'utf8')
const themes=[...css.matchAll(/\[data-rd-theme(?:="(midnight)")?\]\s*\{([^}]+)\}/g)].map(([,name,body])=>({name:name??'default',tokens:Object.fromEntries([...body.matchAll(/(--rd-[\w-]+):([^;]+);/g)].map(([,key,value])=>[key,value.trim()]))}))
const rgb=hex=>{assert.match(hex,/^#(?:[\da-f]{3}|[\da-f]{6})$/i,'Measured tokens must be opaque hex colors');let value=hex.slice(1);if(value.length===3)value=[...value].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255)}
const luminance=rgb=>rgb.map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4).reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0)
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const composite=(foreground,background,alpha)=>foreground.map((value,i)=>value*alpha+background[i]*(1-alpha))
test('Contrast math checks known endpoints and symmetry',()=>{assert.equal(ratio(rgb('#000'),rgb('#fff')),21);assert.equal(ratio(rgb('#abc'),rgb('#abc')),1);assert.equal(ratio(rgb('#fff'),rgb('#000')),21);assert.deepEqual(composite(rgb('#fff'),rgb('#000'),.5),[.5,.5,.5])})
for(const {name,tokens} of themes)test(`Ready ${name}: static semantic contrast for enabled controls`,()=>{
 const color=key=>rgb(tokens[`--rd-${key}`]);const results={}
 const check=(foreground,background,min)=>{const actual=ratio(color(foreground),color(background));results[`${foreground}/${background}`]=Number(actual.toFixed(2));assert.ok(actual>=min,`${name} ${foreground}/${background} ${actual.toFixed(3)} < ${min}:1`)}
 for(const background of ['bg','surface']){check('text',background,4.5);check('muted',background,4.5);check('border',background,3);check('accent',background,3)}
 check('on-accent','accent',4.5)
 // Inactive controls have a WCAG contrast exemption. Report nominal compositing,
 // without treating the reduced contrast as an enabled-control pass or failure.
 results['disabled-checkbox-label/bg']=Number(ratio(composite(color('text'),color('bg'),.5),color('bg')).toFixed(2))
 results['disabled-trigger-text/surface']=Number(ratio(composite(color('text'),color('bg'),.5),composite(color('surface'),color('bg'),.5)).toFixed(2))
 results['disabled-item-text/surface']=Number(ratio(composite(color('text'),color('surface'),.4),color('surface')).toFixed(2))
 console.log(JSON.stringify({theme:name,staticRatios:results}))
})
test('Measured semantic colors remain wired to errors and focus indicators',()=>{
 assert.equal(themes.length,2)
 assert.match(css,/\[data-part="control"\]\s*\{[^}]*border:1px solid var\(--rd-border\)/)
 assert.match(css,/\[data-part="trigger"\]\s*\{[^}]*border:1px solid var\(--rd-border\)/)
 assert.match(css,/\[data-part="root"\]\[data-disabled\]\s*\{\s*opacity:\.5;/)
 assert.match(css,/\[data-part="trigger"\]\[data-disabled\]\s*\{\s*opacity:\.5;/)
 assert.match(css,/\[data-part="item"\]\[data-disabled\]\s*\{\s*opacity:\.4;/)
 assert.match(css,/\.rd-component \.rd-description\s*\{[^}]*color:var\(--rd-muted\)/)
 assert.match(css,/\.rd-component \.rd-empty\s*\{[^}]*color:var\(--rd-muted\)/)
 assert.match(css,/\.rd-component \.rd-error\s*\{[^}]*color:var\(--rd-text\)/)
 assert.match(css,/:focus-visible\s*\{[^}]*outline:3px solid var\(--rd-accent\);[^}]*outline-offset:3px/)
 assert.match(css,/:has\(input:focus-visible\)[^}]*outline:3px solid var\(--rd-accent\)/)
})
// Source-level declaration checks only: this is not a CSS cascade/computed-style
// engine and cannot prove that these states are rendered, focused or unclipped.
for(const [state,selector] of [
 ['accent button','.rd-component .rd-button'],
 ['checked Checkbox','.rd-component [data-scope="checkbox"][data-part="control"][data-state="checked"]'],
 ['highlighted Select item','.rd-component [data-scope="select"][data-part="item"][data-highlighted]'],
])test(`Ready ${state}: declares the measured on-accent/accent pair`,()=>{
 const blocks=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selectors])=>selectors.trim()===selector)
 assert.equal(blocks.length,1,`Expected one explicit rule for ${selector}`)
 const declarations=Object.fromEntries(blocks[0][2].split(';').filter(part=>part.trim()).map(part=>{const colon=part.indexOf(':');return [part.slice(0,colon).trim(),part.slice(colon+1).trim()]}))
 assert.equal(declarations.background,'var(--rd-accent)',`${state} background must use the measured accent`)
 assert.equal(declarations.color,'var(--rd-on-accent)',`${state} foreground must use the measured on-accent`)
})
