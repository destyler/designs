export const frameworks = ['React', 'Vue', 'Solid', 'Svelte'] as const;
export type Framework = typeof frameworks[number];
export type ComponentName = 'Checkbox' | 'Select' | 'Dialog';
const props = {
 Checkbox: 'label="接收产品更新" description="每月一封，只有值得分享的内容。" name="updates"',
 Select: 'label="工作空间" placeholder="选择工作空间" name="workspace"',
 Dialog: 'trigger="打开对话框" title="让工作空间更像你" description="设置只属于当前示例，不会保存到服务器。" closeLabel="关闭"',
};
export function snippet(framework: Framework, component: ComponentName) {
 const base = `@destyler/ready-prototype/${framework.toLowerCase()}`;
 const options = `[{ label: '个人空间', value: 'personal' }, { label: '设计工作室', value: 'studio' }, { label: '企业空间', value: 'enterprise', disabled: true }]`;
 const child = component === 'Dialog' ? '<p>把你的内容放在这里。</p>' : '';
 if (framework === 'Vue') return `<script setup lang="ts">\nimport { ${component} } from '${base}'\n${component === 'Select' ? `const options = ${options}\n` : ''}</script>\n\n<template>\n  <${component} ${props[component]}${component === 'Select' ? ' :options="options"' : ''}${child ? `>\n    ${child}\n  </${component}>` : ' />'}\n</template>`;
 if (framework === 'Svelte') return `<script lang="ts">\n  import { ${component} } from '${base}'\n${component === 'Select' ? `  const options = ${options}\n` : ''}</script>\n\n<${component} ${props[component]}${component === 'Select' ? ' {options}' : ''}${child ? `>\n  ${child}\n</${component}>` : ' />'}`;
 return `import { ${component} } from '${base}'\n\nexport default function Example() {\n${component === 'Select' ? `  const options = ${options}\n` : ''}  return (\n    <${component} ${props[component]}${component === 'Select' ? ' options={options}' : ''}${child ? `>\n      ${child}\n    </${component}>` : ' />'}\n  )\n}`;
}
export const api: Record<ComponentName, [string, string, string][]> = {
 Checkbox: [['label', 'string · 必填', '非空的可访问名称。'], ['checked / onCheckedChange', 'boolean / (value) => void', '可选受控状态；省略 checked 时内部管理。'], ['description / error', 'string', '说明与错误信息，自动关联控件。'], ['name / required / disabled', 'string / boolean', '表单名称、必填、禁用。']],
 Select: [['label / options', 'string / Option[] · 必填', '选项含 label、value 与可选 disabled。'], ['value / onValueChange', 'string / (value) => void', '单选值；空字符串表示未选择。'], ['placeholder / emptyMessage', 'string', '未选择与空列表提示。'], ['description / error / name', 'string', '说明、错误与隐藏表单控件名称。'], ['required / disabled', 'boolean', '必填与禁用。']],
 Dialog: [['trigger / title', 'string · 必填', '触发按钮与对话框标题。'], ['description / closeLabel', 'string', '可选说明；关闭按钮默认 Close。'], ['open / onOpenChange', 'boolean / (value) => void', '可选受控状态。'], ['children / 默认插槽', '内容', 'React / Solid children；Vue 默认 slot；Svelte children snippet。']],
};
export function install(framework: Framework) {
 return `# 获取试点分支；已有本地 checkout 可跳过前两行\ngit clone --branch feat/ready-components-pilot https://github.com/destyler/designs.git\ncd designs\n# 这是本地私有源码包，不是 npm 上已发布的包\nframework=${framework.toLowerCase()}\nwork="$(mktemp -d /tmp/ready-guide-XXXXXX)"\nnpm pack ./packages/ready --pack-destination "$work"\nnode scripts/create-ready-consumer.mjs "$framework" "$work/app" \\\n  "$work/destyler-ready-prototype-0.0.0.tgz"\ncd "$work/app"\nnpm install\nnpm run check\nnpm run build\nnpm run dev`;
}
export const themeCode = `// 1. 应用入口：先基础主题，再自定义覆盖
import '@destyler/ready-prototype/theme.css'
import './custom-theme.css'

/* 2. custom-theme.css */
.my-theme {
  --rd-accent: #7c3aed;
  --rd-on-accent: #ffffff;
  --rd-radius: 16px;
  --rd-font: system-ui, sans-serif;
}

// 3. React JSX；其他框架使用 class="my-theme"
<div data-rd-theme="default" className="my-theme">
  <Example />
</div>
// 内置第二主题：data-rd-theme="midnight"`;
