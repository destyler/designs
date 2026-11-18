export const frameworks = ["React", "Vue", "Solid", "Svelte"] as const;
export type Framework = (typeof frameworks)[number];
export type ComponentName = "Checkbox" | "Select" | "Dialog";
const props = {
  Checkbox: [
    'label="接收产品更新"',
    'description="每月一封，只有值得分享的内容。"',
    'name="updates"',
  ],
  Select: [
    'label="工作空间"',
    'placeholder="选择工作空间"',
    'name="workspace"',
  ],
  Dialog: [
    'trigger="打开对话框"',
    'title="让工作空间更像你"',
    'description="设置只属于当前示例，不会保存到服务器。"',
    'closeLabel="关闭"',
  ],
};
export function snippet(framework: Framework, component: ComponentName) {
  const base = `@destyler/ready-prototype/${framework.toLowerCase()}`;
  const optionLines = [
    "{ label: '个人空间', value: 'personal' },",
    "{ label: '设计工作室', value: 'studio' },",
    "{ label: '企业空间', value: 'enterprise', disabled: true },",
  ];
  const options = (indent: string) =>
    `${indent}const options = [\n${optionLines.map((line) => `${indent}  ${line}`).join("\n")}\n${indent}]\n`;
  const element = (indent: string, option: string) => {
    const attributes = [
      ...props[component],
      ...(component === "Select" ? [option] : []),
    ];
    const start = `${indent}<${component}\n${attributes.map((prop) => `${indent}  ${prop}`).join("\n")}\n${indent}`;
    return component === "Dialog"
      ? `${start}>\n${indent}  <p>把你的内容放在这里。</p>\n${indent}</${component}>`
      : `${start}/>`;
  };
  if (framework === "Vue")
    return `<script setup lang="ts">\nimport { ${component} } from '${base}'\n${component === "Select" ? options("") : ""}</script>\n\n<template>\n${element("  ", ':options="options"')}\n</template>`;
  if (framework === "Svelte")
    return `<script lang="ts">\n  import { ${component} } from '${base}'\n${component === "Select" ? options("  ") : ""}</script>\n\n${element("", "{options}")}`;
  return `import { ${component} } from '${base}'\n\nexport default function Example() {\n${component === "Select" ? options("  ") : ""}  return (\n${element("    ", "options={options}")}\n  )\n}`;
}
export const api: Record<ComponentName, [string, string, string][]> = {
  Checkbox: [
    ["label", "string · 必填", "非空的可访问名称。"],
    [
      "checked / onCheckedChange",
      "boolean / (value) => void",
      "可选受控状态；省略 checked 时内部管理。",
    ],
    ["description / error", "string", "说明与错误信息，自动关联控件。"],
    [
      "name / required / disabled",
      "string / boolean",
      "表单名称、必填、禁用。",
    ],
  ],
  Select: [
    [
      "label / options",
      "string / Option[] · 必填",
      "选项含 label、value 与可选 disabled。",
    ],
    [
      "value / onValueChange",
      "string / (value) => void",
      "单选值；空字符串表示未选择。",
    ],
    ["placeholder / emptyMessage", "string", "未选择与空列表提示。"],
    ["description / error / name", "string", "说明、错误与隐藏表单控件名称。"],
    ["required / disabled", "boolean", "必填与禁用。"],
  ],
  Dialog: [
    ["trigger / title", "string · 必填", "触发按钮与对话框标题。"],
    ["description / closeLabel", "string", "可选说明；关闭按钮默认 Close。"],
    ["open / onOpenChange", "boolean / (value) => void", "可选受控状态。"],
    [
      "children / 默认插槽",
      "内容",
      "React / Solid children；Vue 默认 slot；Svelte children snippet。",
    ],
  ],
};
export function install(framework: Framework) {
  return `# 获取试点分支；已有本地 checkout 可跳过前两行\ngit clone --branch feat/ready-components-pilot https://github.com/destyler/designs.git\ncd designs\n# 这是本地私有源码包，不是 npm 上已发布的包\nframework=${framework.toLowerCase()}\nwork="$(mktemp -d /tmp/ready-guide-XXXXXX)"\nnpm pack ./packages/ready --pack-destination "$work"\nnode scripts/create-ready-consumer.mjs "$framework" "$work/app" \\\n  "$work/destyler-ready-prototype-0.0.0.tgz"\ncd "$work/app"\nnpm install\nnpm run check\nnpm run build\nnpm run dev`;
}
// These versions are the repository's verified consumer baseline, not registry latest.
export const consumerSetup = {
  React: {
    peers: "react@19.2.0 react-dom@19.2.0 @destyler-ui/react@0.0.5",
    plugin: "@vitejs/plugin-react@5.0.4",
    config:
      "import react from '@vitejs/plugin-react'\n\n// 合并到已有 vite.config 的 plugins，勿重复注册\nexport default { plugins: [react()] }",
    entry: "src/main.tsx",
    component: "src/Example.tsx",
  },
  Vue: {
    peers: "vue@3.5.22 @destyler-ui/vue@0.0.5",
    plugin: "@vitejs/plugin-vue@6.0.1",
    config:
      "import vue from '@vitejs/plugin-vue'\n\n// 合并到已有 vite.config 的 plugins，勿重复注册\nexport default { plugins: [vue()] }",
    entry: "src/main.ts",
    component: "src/Example.vue",
  },
  Solid: {
    peers: "solid-js@1.9.17 @destyler-ui/solid@0.0.5",
    plugin: "vite-plugin-solid@2.11.14",
    config:
      "import solid from 'vite-plugin-solid'\n\n// 合并到已有 vite.config 的 plugins，勿重复注册\nexport default { plugins: [solid()] }",
    entry: "src/index.tsx",
    component: "src/Example.tsx",
  },
  Svelte: {
    peers: "svelte@5.57.2 @destyler-ui/svelte@0.0.5",
    plugin: "@sveltejs/vite-plugin-svelte@6.2.4",
    config:
      "import { svelte } from '@sveltejs/vite-plugin-svelte'\n\n// 合并到已有 vite.config 的 plugins，勿重复注册\nexport default { plugins: [svelte()] }",
    entry: "src/main.ts",
    component: "src/Example.svelte",
  },
} as const;
export function existingInstall(framework: Framework) {
  const setup = consumerSetup[framework];
  return `# 先把两处绝对路径换成你的实际路径；在同一终端执行\ncd /absolute/path/to/designs\narchive_dir="$(mktemp -d /tmp/ready-package-XXXXXX)"\nnpm pack ./packages/ready --pack-destination "$archive_dir"\n\n# 以下命令在你已有的 Vite 项目运行，不是 designs 仓库\ncd /absolute/path/to/your-vite-app\nnpm install "$archive_dir/destyler-ready-prototype-0.0.0.tgz" ${setup.peers}\n# 仅在项目尚未配置该框架插件时安装，并合并下一段配置\nnpm install -D ${setup.plugin}`;
}
export function frameworkFromUrl(url: string): Framework {
  const value = new URL(url).searchParams.get("framework")?.toLowerCase();
  return (
    frameworks.find((framework) => framework.toLowerCase() === value) ?? "React"
  );
}
export function urlWithFramework(url: string, framework: Framework): string {
  const result = new URL(url);
  result.searchParams.set("framework", framework.toLowerCase());
  return result.href;
}
export function apiFor(framework: Framework, component: ComponentName) {
  return api[component].map((row) => {
    if (framework !== "Vue") return row;
    const events: Record<string, string> = {
      "checked / onCheckedChange": "checked / update:checked / checkedChange",
      "value / onValueChange": "value / update:value / valueChange",
      "open / onOpenChange": "open / update:open / openChange",
    };
    return events[row[0]]
      ? [
          events[row[0]],
          row[1].replace(" / (value) => void", " / 事件 payload 同类型"),
          `${row[2]} 使用 v-model 或监听对应事件。`,
        ]
      : row;
  });
}
export const themeSnippets = [
  {
    title: "main.tsx · 入口导入（四框架共用）",
    code: `import '@destyler/ready-prototype/theme.css'
import './custom-theme.css'`,
  },
  {
    title: "custom-theme.css · 自定义变量",
    code: `[data-rd-theme].my-theme {
  --rd-accent: #7c3aed;
  --rd-on-accent: #ffffff;
  --rd-radius: 16px;
  --rd-font: system-ui, sans-serif;
}`,
  },
  {
    title: "index.html · 替换原有挂载容器（四框架共用）",
    code: `<main id="app" data-rd-theme="default" class="my-theme"></main>
<!-- 内置第二主题：将 default 改为 midnight -->`,
  },
];

export function controlledSelectSnippet(framework: Framework) {
  const options = `[{ label: '个人空间', value: 'personal' }, { label: '设计工作室', value: 'studio' }]`;
  if (framework === "Vue")
    return `<script setup lang="ts">
import { ref } from 'vue'
import { Select } from '@destyler/ready-prototype/vue'
const value = ref('studio')
const options = ${options}
</script>

<template>
  <Select label="工作空间" name="workspace" placeholder="请选择"
    :options="options" v-model:value="value" />
  <button type="button" @click="value = ''">清空选择</button>
  <p>当前值：{{ value || '未选择' }}</p>
</template>`;
  if (framework === "Svelte")
    return `<script lang="ts">
  import { Select } from '@destyler/ready-prototype/svelte'
  let value = $state('studio')
  const options = ${options}
</script>

<Select label="工作空间" name="workspace" placeholder="请选择"
  {options} {value} onValueChange={(next) => { value = next }} />
<button type="button" onclick={() => { value = '' }}>清空选择</button>
<p>当前值：{value || '未选择'}</p>`;
  const solid = framework === "Solid";
  return `import { ${solid ? "createSignal" : "useState"} } from '${solid ? "solid-js" : "react"}'
import { Select } from '@destyler/ready-prototype/${framework.toLowerCase()}'

export default function Example() {
  const [value, setValue] = ${solid ? "createSignal" : "useState"}('studio')
  const options = ${options}
  return <>
    <Select label="工作空间" name="workspace" placeholder="请选择"
      options={options} value={${solid ? "value()" : "value"}} onValueChange={setValue} />
    <button type="button" onClick={() => setValue('')}>清空选择</button>
    <p>当前值：{${solid ? "value()" : "value"} || '未选择'}</p>
  </>
}`;
}

// Small, explicit page-keyword index. This is not a full-text search engine.
export const documentationPages = [
  {
    id: "overview",
    title: "概览",
    keywords: "介绍 组件 总览 框架 React Vue Solid Svelte",
  },
  {
    id: "installation",
    title: "开始使用",
    keywords:
      "安装 接入 已有项目 Vite npm tarball tgz 本地包 私有包 peer 依赖 编译 插件 CSS 导入 入口 TypeScript 快速开始",
  },
  {
    id: "checkbox",
    title: "Checkbox",
    keywords:
      "复选框 勾选 选中 表单 required disabled checked onCheckedChange description error API",
  },
  {
    id: "select",
    title: "Select",
    keywords:
      "选择器 下拉 选项 受控 非受控 controlled 清空 value onValueChange v-model 禁用 options placeholder 表单 键盘 API",
  },
  {
    id: "dialog",
    title: "Dialog",
    keywords:
      "对话框 弹窗 模态 焦点 focus 关闭 open onOpenChange trigger title children 插槽 API",
  },
  {
    id: "themes",
    title: "主题",
    keywords:
      "样式 theme theming CSS 变量 token Everyday Midnight 深色 浅色 自定义 覆盖",
  },
  {
    id: "boundaries",
    title: "使用边界",
    keywords:
      "限制 SSR 水合 hydration 嵌套 overlay portal Escape 表单 reset 重置 验证 无障碍",
  },
] as const;
export function searchDocumentation(query: string) {
  const normalize = (value: string) => value.normalize("NFKC").toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return documentationPages.filter((page) => {
    const text = normalize(`${page.id} ${page.title} ${page.keywords}`);
    return terms.every((term) => text.includes(term));
  });
}
