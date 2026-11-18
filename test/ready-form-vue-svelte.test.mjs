import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv[2] === "worker") {
  const { Window } = await import(root + "node_modules/happy-dom/lib/index.js");
  const win = new Window({ url: "http://localhost/" });
  for (const key of Object.getOwnPropertyNames(win)) {
    if (
      ["window", "document", "navigator"].includes(key) ||
      /^(HTML.*Element|SVG.*Element|Document|Text|Comment|DocumentType|ShadowRoot|CSS.*|Node.*|Element|Event|CustomEvent|MouseEvent|PointerEvent|KeyboardEvent|InputEvent|MutationObserver|ResizeObserver|IntersectionObserver)$/.test(
        key,
      )
    )
      try {
        Object.defineProperty(globalThis, key, {
          configurable: true,
          writable: true,
          value: win[key],
        });
      } catch {}
  }
  for (const key of [
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ])
    globalThis[key] = win[key].bind(win);
  globalThis.window = win;
  globalThis.document = win.document;
  const { run } = await import(process.argv[3]);
  const settle = () => new Promise((r) => setTimeout(r, 100));
  for (const mode of [
    "uncontrolled",
    "controlled-ignore",
    "controlled-accept",
    "controlled-initial",
    "cancelled",
  ]) {
    const target = document.createElement("div");
    document.body.append(target);
    const events = [];
    const app = run(target, mode, events);
    await settle();
    const form = target.querySelector("form");
    const part = (scope, part) =>
      target.querySelector(`[data-scope="${scope}"][data-part="${part}"]`);
    const snapshot = () => ({
      checked: target.querySelector("input[type=checkbox]").checked,
      visibleCheck: part("checkbox", "control").getAttribute("data-state"),
      select: target.querySelector("select").value,
      visibleSelect: part("select", "value-text").textContent,
      events: JSON.parse(JSON.stringify(events)),
    });
    if (mode.startsWith("controlled")) {
      app.change();
      await settle();
    } else {
      part("checkbox", "control").click();
      await settle();
      part("select", "trigger").click();
      await settle();
      target
        .querySelector(
          '[data-scope="select"][data-part="item"][data-value="b"]',
        )
        .click();
      await settle();
    }
    const before = snapshot();
    events.length = 0;
    if (mode === "cancelled") {
      // Happy DOM resets controls before dispatching reset and ignores cancellation.
      // Use an explicit canceled event: the browser's default reset must not run.
      form.addEventListener("reset", (e) => e.preventDefault());
      const event = new win.Event("reset", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
    } else form.reset();
    await settle();
    const after = snapshot();
    const kept =
      mode === "controlled-ignore" ||
      mode === "controlled-initial" ||
      mode === "cancelled";
    assert.equal(after.checked, kept);
    assert.equal(after.visibleCheck, kept ? "checked" : "unchecked");
    assert.equal(after.select, kept ? "b" : "");
    assert.equal(after.visibleSelect, kept ? "B" : "Choose an option");
    assert.deepEqual(
      after.events,
      mode === "cancelled" || mode === "controlled-initial"
        ? []
        : [
            ["checked", false],
            ["value", ""],
          ],
    );
    const data = new win.FormData(form);
    assert.equal(data.has("check"), kept);
    assert.equal(data.get("choice"), kept ? "b" : "");
    const defaultOption = [...target.querySelector("select").options].find(
      (option) => option.value === (kept ? "b" : ""),
    );
    assert.ok(
      defaultOption,
      "Effective value has a native option, including the empty option",
    );
    // selected is the standard attribute reflected by defaultSelected. Happy DOM lacks that property.
    assert.equal(defaultOption.hasAttribute("selected"), true);
    if (mode === "controlled-initial") {
      form.reset();
      await settle();
      assert.deepEqual(
        snapshot(),
        after,
        "Unchanged initial controlled value survives repeated reset without callbacks",
      );
    }
    console.log(JSON.stringify({ mode, before, after }));
    await app.cleanup();
    target.remove();
  }
  await win.happyDOM.close();
} else {
  const { build } = await import(root + "node_modules/vite/dist/node/index.js");
  for (const fw of ["vue", "svelte"])
    test(
      `Ready ${fw} form reset: uncontrolled, controlled accept/ignore and cancellation`,
      { timeout: 120000 },
      async () => {
        const folder = await mkdtemp(root + "node_modules/.ready-form-probe-");
        let plugin, code;
        if (fw === "vue") {
          plugin = (
            await import(root + "node_modules/@vitejs/plugin-vue/dist/index.js")
          ).default();
          code = `import {createApp,h,ref} from 'vue';import {Checkbox,Select} from '${root}packages/ready/vue';export function run(target,mode,events){const checked=ref(mode==='controlled-initial'),value=ref(mode==='controlled-initial'?'b':'');const app=createApp({render:()=>h('form',[h(Checkbox,{label:'Check',name:'check',...(mode.startsWith('controlled')?{checked:checked.value}:{}),onCheckedChange:v=>{events.push(['checked',v]);if(mode==='controlled-accept')checked.value=v}}),h(Select,{label:'Choice',name:'choice',options:[{label:'A',value:'a'},{label:'B',value:'b'}],...(mode.startsWith('controlled')?{value:value.value}:{}),onValueChange:v=>{events.push(['value',v]);if(mode==='controlled-accept')value.value=v}})])});app.mount(target);return{change(){checked.value=true;value.value='b'},cleanup:()=>app.unmount()}}`;
        } else {
          plugin = (
            await import(
              root + "node_modules/@sveltejs/vite-plugin-svelte/src/index.js"
            )
          ).svelte({ configFile: false });
          await writeFile(
            join(folder, "Fixture.svelte"),
            `<script>import {Checkbox,Select} from '${root}packages/ready/svelte';let {mode,events}=$props();let checked=$state(mode==='controlled-initial'),value=$state(mode==='controlled-initial'?'b':'');export function change(){checked=true;value='b'}</script><form><Checkbox label="Check" name="check" checked={mode.startsWith('controlled')?checked:undefined} onCheckedChange={v=>{events.push(['checked',v]);if(mode==='controlled-accept')checked=v}}/><Select label="Choice" name="choice" options={[{label:'A',value:'a'},{label:'B',value:'b'}]} value={mode.startsWith('controlled')?value:undefined} onValueChange={v=>{events.push(['value',v]);if(mode==='controlled-accept')value=v}}/></form>`,
          );
          code = `import {mount,unmount} from 'svelte';import Fixture from './Fixture.svelte';export function run(target,mode,events){const app=mount(Fixture,{target,props:{mode,events}});return{change:()=>app.change(),cleanup:()=>unmount(app)}}`;
        }
        const entry = join(folder, "entry.mjs");
        await writeFile(entry, code);
        await build({
          root,
          configFile: false,
          logLevel: "error",
          plugins: [plugin],
          build: {
            outDir: join(folder, "out"),
            minify: false,
            lib: { entry, formats: ["es"], fileName: () => "client.mjs" },
          },
        });
        console.log(fw);
        console.log(
          execFileSync(
            process.execPath,
            [import.meta.filename, "worker", join(folder, "out/client.mjs")],
            { encoding: "utf8", cwd: root, timeout: 30000 },
          ),
        );
        await rm(folder, { recursive: true, force: true });
      },
    );
}
