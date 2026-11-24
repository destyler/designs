import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const ready = join(root, 'packages/ready')
const fixtures = {
  react: `import {useState} from 'react'; import {Avatar} from '${ready}/react/Avatar';
  export default function App(){const [source,setSource]=useState('/first.png');return <><Avatar alt="Ada Lovelace" src={source}/><Avatar alt="张三" src=" "/><Avatar alt="" fallback="•"/><button id="replace" onClick={()=>setSource('/second.png')}>Replace</button><button id="remove" onClick={()=>setSource('')}>Remove</button></>}`,
  solid: `import {createSignal} from 'solid-js'; import {Avatar} from '${ready}/solid/Avatar';
  export default function App(){const [source,setSource]=createSignal('/first.png');return <><Avatar alt="Ada Lovelace" src={source()}/><Avatar alt="张三" src=" "/><Avatar alt="" fallback="•"/><button id="replace" onClick={()=>setSource('/second.png')}>Replace</button><button id="remove" onClick={()=>setSource('')}>Remove</button></>}`,
  vue: `<script setup>import {ref} from 'vue';import Avatar from '${ready}/vue/Avatar.vue';const source=ref('/first.png')</script><template><Avatar alt="Ada Lovelace" :src="source"/><Avatar alt="张三" src=" "/><Avatar alt="" fallback="•"/><button id="replace" @click="source='/second.png'">Replace</button><button id="remove" @click="source=''">Remove</button></template>`,
  svelte: `<script>import Avatar from '${ready}/svelte/Avatar.svelte';let source=$state('/first.png')</script><Avatar alt="Ada Lovelace" src={source}/><Avatar alt="张三" src=" "/><Avatar alt="" fallback="•"/><button id="replace" onclick={()=>source='/second.png'}>Replace</button><button id="remove" onclick={()=>source=''}>Remove</button>`,
}

const eventually = async check => {
  const deadline = Date.now() + 2500;
  for (;;) {
    try { check(); return; }
    catch(error) {
      if (Date.now() >= deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }
};

function checkInitial(document) {
  const named = [...document.querySelectorAll('[role=img]')];
  assert.deepEqual(named.map(item=>item.getAttribute('aria-label')), ['Ada Lovelace', '张三']);
  const decorated = document.querySelector('.rd-avatar[aria-hidden="true"]');
  assert.equal(decorated.getAttribute('role'), null);
  assert.equal(decorated.textContent.trim(), '•');
  assert.equal(named[1].querySelector('img'), null, 'blank src never creates an img');
  assert.equal(named[1].textContent.trim(), '张三');
  const image = named[0].querySelector('img');
  assert.equal(image.getAttribute('alt'), '');
  assert.equal(image.getAttribute('aria-hidden'), 'true');
  assert.equal(image.hidden, true, 'initial image cannot flash before load');
  const fallback = named[0].querySelector('[data-part=fallback]');
  assert.equal(fallback.getAttribute('aria-hidden'), 'true');
  assert.equal(fallback.textContent.trim(), 'AL');
  assert.equal(fallback.hidden, false);
}

if (process.argv[2] === '--run-client' || process.argv[2] === '--run-server') {
  const ssr = process.argv[2] === '--run-server';
  if (ssr) {
    assert.equal(typeof document, 'undefined');
    const { html } = await import(pathToFileURL(process.argv[3]));
    const markup = await html();
    const { Window } = await import('happy-dom');
    const win = new Window({ url:'http://localhost/' });
    win.document.body.innerHTML = markup;
    checkInitial(win.document);
    await win.happyDOM.close();
  } else {
    const { Window } = await import('happy-dom');
    const win = new Window({ url:'http://localhost/' });
    for (const key of Object.getOwnPropertyNames(win)) if (/^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver|navigator)$/.test(key)) {
      Object.defineProperty(globalThis, key, { configurable:true, writable:true, value:win[key] });
    }
    globalThis.window = win;
    globalThis.document = win.document;
    for (const key of ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) globalThis[key] = win[key].bind(win);
    document.body.innerHTML = '<main id="app"></main>';
    const { dispose } = await import(pathToFileURL(process.argv[3]));
    await eventually(() => checkInitial(document));
    const current = () => document.querySelector('[role=img][aria-label="Ada Lovelace"]');
    const image = () => current().querySelector('img');
    const fallback = () => current().querySelector('[data-part=fallback]');
    const first = image();
    first.dispatchEvent(new Event('load'));
    await eventually(() => {
      assert.equal(image().hidden, false);
      assert.equal(fallback().hidden, true);
    });
    document.getElementById('replace').click();
    await eventually(() => {
      assert.equal(image()?.getAttribute('src'), '/second.png');
      assert.equal(image().hidden, true);
      assert.equal(fallback().hidden, false);
    });
    assert.notEqual(image(), first, 'a new source uses a fresh image node');
    image().dispatchEvent(new Event('error'));
    assert.equal(fallback().hidden, false);
    image().dispatchEvent(new Event('load'));
    await eventually(() => assert.equal(fallback().hidden, true));
    image().dispatchEvent(new Event('error'));
    await eventually(() => assert.equal(fallback().hidden, false));
    document.getElementById('remove').click();
    await eventually(() => assert.equal(Boolean(image()), false, 'omitting src removes the img'));
    assert.equal(fallback().textContent.trim(), 'AL');
    await dispose();
    await win.happyDOM.close();
  }
} else {
  for (const framework of Object.keys(fixtures)) test(`Ready Avatar fallback, image events and accessible name in ${framework}`, { timeout:60000 }, async () => {
    const folder = await mkdtemp(join(root, 'node_modules/.ready-avatar-'));
    try {
      const ext = { react:'tsx', solid:'tsx', vue:'vue', svelte:'svelte' }[framework];
      const fixture = `./Fixture.${ext}`;
      await writeFile(join(folder, fixture), fixtures[framework]);
      const clients = {
        react:`import {createRoot} from 'react-dom/client';import {createElement} from 'react';import App from '${fixture}';const root=createRoot(document.getElementById('app'));root.render(createElement(App));export const dispose=()=>root.unmount();`,
        solid:`import {render} from 'solid-js/web';import App from '${fixture}';export const dispose=render(()=>App(),document.getElementById('app'));`,
        vue:`import {createApp} from 'vue';import App from '${fixture}';const app=createApp(App);app.mount('#app');export const dispose=()=>app.unmount();`,
        svelte:`import {mount,unmount} from 'svelte';import App from '${fixture}';const app=mount(App,{target:document.getElementById('app')});export const dispose=()=>unmount(app);`,
      };
      const servers = {
        react:`import {renderToString} from 'react-dom/server';import {createElement} from 'react';import App from '${fixture}';export const html=()=>renderToString(createElement(App));`,
        solid:`import {renderToString} from 'solid-js/web';import App from '${fixture}';export const html=()=>renderToString(()=>App());`,
        vue:`import {renderToString} from 'vue/server-renderer';import {createSSRApp} from 'vue';import App from '${fixture}';export const html=()=>renderToString(createSSRApp(App));`,
        svelte:`import {render} from 'svelte/server';import App from '${fixture}';export const html=()=>render(App).body;`,
      };
      for (const mode of ['client','server']) {
        const ssr = mode === 'server';
        const entry = join(folder, mode+'.mjs');
        const out = join(folder,mode);
        await writeFile(entry, (ssr ? servers : clients)[framework]);
        const plugin = await ({
          react:async()=> (await import('@vitejs/plugin-react')).default(),
          solid:async()=> (await import('vite-plugin-solid')).default({ssr}),
          vue:async()=> (await import('@vitejs/plugin-vue')).default(),
          svelte:async()=> (await import('@sveltejs/vite-plugin-svelte')).svelte({configFile:false}),
        }[framework]());
        await build({ root, configFile:false, logLevel:'error', publicDir:false, plugins:[plugin], ssr:{noExternal:true}, build:{ ssr:ssr?entry:false, outDir:out, minify:false, lib:ssr?undefined:{entry,formats:['es'],fileName:()=> 'entry.mjs'}, rollupOptions:{output:{entryFileNames:'entry.mjs',inlineDynamicImports:true}} } });
        execFileSync(process.execPath, [filename, '--run-'+mode, join(out,'entry.mjs')], {cwd:root, encoding:'utf8', timeout:15000, stdio:'inherit'});
      }
    } finally { await rm(folder,{recursive:true,force:true}); }
  });
}
