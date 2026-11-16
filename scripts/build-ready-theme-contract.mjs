// Real packed-package, four-native-framework consumers for browser theme QA.
import { build } from "vite";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
export async function buildThemeContract(
  out = resolve(root, "artifacts/ready-theme-contract"),
) {
  const temp = await mkdtemp(join(root, "node_modules/.theme-contract-"));
  try {
    const [packed] = JSON.parse(
      execFileSync(
        "npm",
        [
          "pack",
          "./packages/ready",
          "--json",
          "--ignore-scripts",
          "--pack-destination",
          temp,
          "--cache",
          "/tmp/ready-pack-cache",
        ],
        { cwd: root, encoding: "utf8" },
      ),
    );
    const target = join(temp, "node_modules/@destyler/ready-prototype");
    await mkdir(target, { recursive: true });
    execFileSync("tar", [
      "-xzf",
      join(temp, packed.filename),
      "--strip-components=1",
      "-C",
      target,
    ]);
    const ids = [
      "unscoped",
      "explicit",
      "midnight",
      "custom",
      "nested",
      "nested-custom",
    ];
    const controls =
      '<Checkbox label="接收更新" name="updates" /><Select label="工作空间" name="workspace" options={options} /><Dialog trigger="打开对话框" title="主题验证" closeLabel="关闭"><p>无需主题容器的默认组件。</p></Dialog>';
    for (const framework of ["react", "vue", "solid", "svelte"]) {
      const dir = join(temp, framework);
      await mkdir(dir);
      const extension = { vue: "vue", svelte: "svelte" }[framework] || "tsx";
      const imp = `import {Checkbox,Select,Dialog} from '@destyler/ready-prototype/${framework}'`;
      const options =
        "const options=[{label:'个人空间',value:'personal'},{label:'工作室',value:'studio'}]";
      const source =
        framework === "vue"
          ? `<script setup>${imp};${options}</script><template>${controls.replace("options={options}", ':options="options"')}</template>`
          : framework === "svelte"
            ? `<script>${imp};${options}</script>${controls}`
            : `${imp};${options};export default function App(){return <>${controls}</>}`;
      await writeFile(join(dir, `App.${extension}`), source);
      const mounting = {
        react: `import {createRoot} from 'react-dom/client';for(const id of ids)createRoot(document.getElementById(id)).render(<App/>);`,
        vue: `import {createApp} from 'vue';for(const id of ids){const app=createApp(App);app.config.idPrefix=id;app.mount('#'+id);}`,
        solid: `import {render} from 'solid-js/web';for(const id of ids)render(()=> <App/>,document.getElementById(id));`,
        svelte: `import {mount} from 'svelte';for(const id of ids)mount(App,{target:document.getElementById(id)});`,
      }[framework];
      await writeFile(
        join(dir, "main.tsx"),
        `import App from './App.${extension}';import '@destyler/ready-prototype/theme.css';const ids=${JSON.stringify(ids)};${mounting};document.getElementById('toggle-theme').addEventListener('click',()=>{const scope=document.getElementById('switch-scope');scope.dataset.rdTheme=scope.dataset.rdTheme==='midnight'?'default':'midnight'});`,
      );
      await writeFile(
        join(dir, "index.html"),
        `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${framework} import-only theme contract</title><style>body{margin:24px;background:#ede8df;color:#432818;font:16px system-ui}section{margin:20px 0;padding:20px;border:1px solid #999}main{display:grid;gap:16px;max-width:440px}a{margin-right:12px}h2{font:600 18px system-ui}</style><nav>${["react", "vue", "solid", "svelte"].map((f) => `<a href="../${f}/">${f}</a>`).join("")}</nav><h1>${framework}: import CSS only</h1><p id="host-sentinel">Host: warm background / brown text remain untouched.</p><button id="host-button">Ordinary native host button</button><section><h2>No theme ancestor</h2><main id="unscoped"></main></section><section data-rd-theme="default"><h2>Explicit default</h2><main id="explicit"></main></section><button id="toggle-theme">切换下方外层主题（保留状态）</button><section id="switch-scope" data-rd-theme="midnight"><h2>Switchable Midnight / default</h2><main id="midnight"></main><section data-rd-theme="default"><h2>Nested default resets Midnight</h2><main id="nested"></main></section></section><section style="--rd-accent:#6d28d9;--rd-radius:18px"><h2>Custom tokens without a theme attribute</h2><main id="custom"></main><section data-rd-theme="midnight"><h2>Nested Midnight resets custom tokens</h2><main id="nested-custom"></main></section></section><script type="module" src="./main.tsx"></script></html>`,
      );
      const plugins = {
        react: () => import("@vitejs/plugin-react").then((m) => m.default()),
        vue: () => import("@vitejs/plugin-vue").then((m) => m.default()),
        solid: () => import("vite-plugin-solid").then((m) => m.default()),
        svelte: () =>
          import("@sveltejs/vite-plugin-svelte").then((m) => m.svelte()),
      };
      await build({
        root: dir,
        configFile: false,
        base: "./",
        plugins: [await plugins[framework]()],
        build: { outDir: join(out, framework), emptyOutDir: true },
      });
    }
    return out;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(await buildThemeContract());
