import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const textFixtures = {
  react: `import {createRoot} from 'react-dom/client';import {useState} from 'react';import {Progress} from '${ready}/react/Progress';import {Collapsible} from '${ready}/react/Collapsible';
    function App(){const [value,setValue]=useState(0),[open,setOpen]=useState(false),[count,setCount]=useState(0);
      return <form onSubmit={e=>{e.preventDefault();setCount(n=>n+100)}}><Progress label="Upload" value={value} min={-10} max={30}/><Progress label="Second" value={null}/><button type="button" id="indeterminate" onClick={()=>setValue(null)}>Set indeterminate</button><button type="button" id="determinate" onClick={()=>setValue(20)}>Set determinate</button><button type="button" id="controlled" onClick={()=>setOpen(v=>!v)}>Toggle externally</button>
        <Collapsible trigger="Details" onOpenChange={()=>setCount(n=>n+1)}><b>Panel text</b></Collapsible><Collapsible trigger="Initially open" defaultOpen>Initially open panel</Collapsible>
        <Collapsible trigger="Controlled" open={open} onOpenChange={()=>setCount(n=>n+1)}>Controlled panel</Collapsible><Collapsible trigger="Disabled" disabled>Disabled panel</Collapsible><output>{count}</output></form>}
    createRoot(document.getElementById('app')).render(<App />)`,
  solid: `import {createSignal} from 'solid-js';import {render} from 'solid-js/web';import {Progress} from '${ready}/solid/Progress';import {Collapsible} from '${ready}/solid/Collapsible';
    function App(){const [value,setValue]=createSignal(0),[open,setOpen]=createSignal(false),[count,setCount]=createSignal(0);
      return <form onSubmit={e=>{e.preventDefault();setCount(n=>n+100)}}><Progress label="Upload" value={value()} min={-10} max={30}/><Progress label="Second" value={null}/><button type="button" id="indeterminate" onClick={()=>setValue(null)}>Set indeterminate</button><button type="button" id="determinate" onClick={()=>setValue(20)}>Set determinate</button><button type="button" id="controlled" onClick={()=>setOpen(v=>!v)}>Toggle externally</button>
        <Collapsible trigger="Details" onOpenChange={()=>setCount(n=>n+1)}><b>Panel text</b></Collapsible><Collapsible trigger="Initially open" defaultOpen>Initially open panel</Collapsible>
        <Collapsible trigger="Controlled" open={open()} onOpenChange={()=>setCount(n=>n+1)}>Controlled panel</Collapsible><Collapsible trigger="Disabled" disabled>Disabled panel</Collapsible><output>{count()}</output></form>}
    render(()=> <App/>,document.getElementById('app'))`,
  vue: `<script setup>import {ref} from 'vue';import Progress from '${ready}/vue/Progress.vue';import Collapsible from '${ready}/vue/Collapsible.vue';const value=ref(0),open=ref(false),count=ref(0)</script>
    <template><form @submit.prevent="count+=100"><Progress label="Upload" :value="value" :min="-10" :max="30"/><Progress label="Second" :value="null"/><button type="button" id="indeterminate" @click="value=null">Set indeterminate</button><button type="button" id="determinate" @click="value=20">Set determinate</button><button type="button" id="controlled" @click="open=!open">Toggle externally</button>
    <Collapsible trigger="Details" @open-change="count++"><b>Panel text</b></Collapsible><Collapsible trigger="Initially open" default-open>Initially open panel</Collapsible>
    <Collapsible trigger="Controlled" :open="open" @open-change="count++">Controlled panel</Collapsible><Collapsible trigger="Disabled" disabled>Disabled panel</Collapsible><output>{{count}}</output></form></template>`,
  svelte: `<script>import Progress from '${ready}/svelte/Progress.svelte';import Collapsible from '${ready}/svelte/Collapsible.svelte';let value=$state(0),open=$state(false),count=$state(0)</script>
    <form onsubmit={e=>{e.preventDefault();count+=100}}><Progress label="Upload" {value} min={-10} max={30}/><Progress label="Second" value={null}/><button type="button" id="indeterminate" onclick={()=>value=null}>Set indeterminate</button><button type="button" id="determinate" onclick={()=>value=20}>Set determinate</button><button type="button" id="controlled" onclick={()=>open=!open}>Toggle externally</button>
      <Collapsible trigger="Details" onOpenChange={()=>count++}><b>Panel text</b></Collapsible><Collapsible trigger="Initially open" defaultOpen>Initially open panel</Collapsible>
      <Collapsible trigger="Controlled" {open} onOpenChange={()=>count++}>Controlled panel</Collapsible><Collapsible trigger="Disabled" disabled>Disabled panel</Collapsible><output>{count}</output></form>`,
}

async function verify(document, press, eventually) {
  const button = name => [...document.querySelectorAll('[data-scope=collapsible][data-part=trigger]')].find(item => item.textContent === name);
  const progress = () => [...document.querySelectorAll('[role=progressbar]')];
  await eventually(() => assert.equal(progress().length, 2));
  const [primary, second] = progress();
  const label = item => document.getElementById(item.getAttribute('aria-labelledby'));
  assert.equal(label(primary)?.textContent, 'Upload');
  assert.equal(label(second)?.textContent, 'Second');
  assert.notEqual(label(primary).id, label(second).id);
  assert.equal(primary.getAttribute('aria-valuemin'), '-10');
  assert.equal(primary.getAttribute('aria-valuemax'), '30');
  assert.equal(primary.getAttribute('aria-valuenow'), '0');
  assert.equal(second.getAttribute('aria-valuenow'), null);
  assert.equal(primary.querySelector('[data-part=range]').style.width, '25%');
  await press('#indeterminate');
  await eventually(() => assert.equal(primary.getAttribute('aria-valuenow'), null));
  assert.equal(primary.getAttribute('data-state'), 'indeterminate');
  await press('#determinate');
  await eventually(() => assert.equal(primary.getAttribute('aria-valuenow'), '20'));
  assert.equal(primary.querySelector('[data-part=range]').style.width, '75%');

  const details = button('Details'), control = button('Controlled'), disabled = button('Disabled');
  const panel = item => document.getElementById(item.getAttribute('aria-controls'));
  assert.equal(details.getAttribute('type'), 'button');
  assert.equal(panel(details).textContent, 'Panel text');
  assert.equal(panel(details).hidden, true);
  assert.equal(button('Initially open').getAttribute('aria-expanded'), 'true');
  assert.equal(panel(button('Initially open')).hidden, false);
  assert.equal(disabled.disabled, true);
  const count = () => document.querySelector('output').textContent;
  assert.equal(count(), '0');
  await press(details);
  await eventually(() => assert.equal(panel(details).hidden, false));
  assert.equal(details.getAttribute('aria-expanded'), 'true');
  assert.equal(count(), '1');
  await press(details);
  await eventually(() => assert.equal(panel(details).hidden, true));
  assert.equal(details.getAttribute('aria-expanded'), 'false');
  assert.equal(count(), '2');
  await press(control);
  await eventually(() => assert.equal(count(), '3'));
  assert.equal(panel(control).hidden, true, 'controlled parent can reject an open request');
  await press('#controlled');
  await eventually(() => assert.equal(panel(control).hidden, false));
  await press('#controlled');
  await eventually(() => assert.equal(panel(control).hidden, true));
  assert.equal(count(), '3', 'external synchronization does not emit a change or submit the form');
}

async function eventually(check) {
  const deadline = Date.now()+2500;
  while (true) {
    try { check(); return; }
    catch (error) {
      if (Date.now() >= deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }
}

if (process.argv[2] === '--dom') {
  const {Window} = await import('happy-dom');
  const window = new Window({url:'http://localhost/'});
  for (const key of Object.getOwnPropertyNames(window)) {
    if (/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|DOMParser|navigator)$/.test(key)) {
      Object.defineProperty(globalThis, key, {configurable:true,writable:true,value:window[key]});
    }
  }
  globalThis.window = window;
  globalThis.document = window.document;
  for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])
    globalThis[key] = window[key].bind(window);
  document.body.innerHTML = '<main id="app"></main>';
  await import(pathToFileURL(process.argv[3]));
  await verify(document, node => (typeof node === 'string' ? document.querySelector(node) : node).click(), eventually);
  await window.happyDOM.close();
} else {
  for (const framework of Object.keys(textFixtures)) test(`Ready Progress and Collapsible handle updates and native semantics in ${framework}`, {timeout:60000}, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-disclosure-'));
    try {
      let entry, plugin;
      if (framework === 'vue' || framework === 'svelte') {
        const extension = framework === 'vue' ? 'vue' : 'svelte';
        await writeFile(join(folder,`Fixture.${extension}`),textFixtures[framework]);
        entry = join(folder,'entry.js');
        await writeFile(entry,framework === 'vue'
          ? `import {createApp} from 'vue';import App from './Fixture.vue';createApp(App).mount('#app')`
          : `import {mount} from 'svelte';import App from './Fixture.svelte';mount(App,{target:document.getElementById('app')})`);
        plugin = framework === 'vue' ? (await import('@vitejs/plugin-vue')).default() : (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false});
      } else {
        entry = join(folder,'entry.tsx');
        await writeFile(entry,textFixtures[framework]);
        plugin = framework === 'react' ? (await import('@vitejs/plugin-react')).default() : (await import('vite-plugin-solid')).default();
      }
      await build({root,configFile:false,logLevel:'error',plugins:[plugin],build:{outDir:join(folder,'out'),minify:false,lib:{entry,formats:['es'],fileName:()=> 'entry.mjs'},rollupOptions:{output:{inlineDynamicImports:true}}}});
      const bundle = join(folder,'out/entry.mjs');
      execFileSync(process.execPath,[filename,'--dom',bundle],{cwd:root,encoding:'utf8',timeout:12000,stdio:'inherit'});
      if (process.env.READY_CHROMIUM_PATH) {
        const {chromium} = await import('playwright');
        const browser = await chromium.launch({executablePath:process.env.READY_CHROMIUM_PATH});
        try {
          const page = await browser.newPage();
          const errors=[];
          page.on('pageerror', error=>errors.push(error.message));
          await page.setContent('<main id="app"></main>');
          await page.addScriptTag({type:'module',content:await readFile(bundle,'utf8')});
          await page.getByRole('progressbar',{name:'Upload'}).waitFor();
          await page.getByRole('button',{name:'Details',exact:true}).press('Space');
          await page.getByText('Panel text').waitFor({state:'visible'});
          await page.getByRole('button',{name:'Details',exact:true}).press('Enter');
          await page.getByText('Panel text').waitFor({state:'hidden'});
          assert.deepEqual(errors, []);
        } finally {await browser.close();}
      }
    } finally {await rm(folder,{recursive:true,force:true});}
  });
}
