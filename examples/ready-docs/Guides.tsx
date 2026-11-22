import { CopyCode, FrameworkPicker, ThemeSwitch } from "./Controls";
import { LivePreview } from "./LivePreview";
import {
  consumerSetup,
  existingInstall,
  install,
  optionalCompilerInstall,
  snippet,
  themeSnippets,
  type Framework,
} from "./content";

type FrameworkControls = {
  framework: Framework;
  onFramework: (value: Framework) => void;
};
type ComponentTheme = "default" | "midnight";

const compilerNotes: Record<Framework, string> = {
  React:
    '设置 jsx: "react-jsx"，并保留匹配 React 19 的 @types/react 与 @types/react-dom。',
  Vue: "使用 vue-tsc 检查类型，不要用普通 TypeScript 编译 .vue 文件。",
  Solid: '设置 jsx: "preserve" 和 jsxImportSource: "solid-js"。',
  Svelte: "使用 svelte-check，并保留项目已有的 svelte.config。",
};

export function InstallationGuide({
  framework,
  onFramework,
}: FrameworkControls) {
  const setup = consumerSetup[framework];

  return (
    <div className="guide-body">
      <p>
        Ready 是私有的 Vite 源码包，尚未发布到 npm。准备一个 designs 仓库副本；
        推荐已验证的 Node 24.22.1 和 npm 11.9.0。Node 22 的最低版本为
        22.22.3，但该最低版本尚未运行验证；不要使用 Node 23。
      </p>
      <FrameworkPicker value={framework} onChange={onFramework} />

      <section id="new-project">
        <h2>新建示例项目</h2>
        <p>
          命令会在临时目录中打包 Ready，创建一个独立的 {framework}{" "}
          应用，不会改动已有项目。
        </p>
        <CopyCode code={install(framework)} title={`${framework} · 本地安装`} />
        <p>
          生成器已经导入 CSS 并附带主题容器。
          {framework === "React" || framework === "Solid"
            ? " 将示例保存为 Example.tsx，再从生成的入口导入并渲染，保留原有挂载和 CSS。"
            : ` 替换生成的 ${framework === "Vue" ? "App.vue" : "App.svelte"} 内容，保留原有入口。`}
        </p>
      </section>

      <section id="existing-project" data-doc-existing-project>
        <h2>接入已有 Vite 项目</h2>
        <p>
          从 designs 仓库打包，再安装应用相对路径下的 <code>.tgz</code>
          。下方版本是已验证组合。
          命令会修改应用依赖和锁文件，请先核对版本，不要盲目降级。
        </p>
        <CopyCode
          code={existingInstall(framework)}
          title={`${framework} · 已有项目安装`}
        />
        <p>
          Ready 将框架 peerDependencies 标为
          optional，以免安装其余三套框架；所选子路径仍需要对应的运行时及{" "}
          <code>@destyler-ui</code> 包，UI 的 <code>@destyler/*</code> 依赖由
          npm 解析。 若包版本变化，请使用 <code>npm pack</code>{" "}
          实际输出的文件名。
        </p>
        <h3>在新环境和 CI 中重装</h3>
        <p className="api-note" data-doc-note="tarball-reinstall">
          将 <code>vendor/destyler</code> 中的 <code>.tgz</code> 与
          <code>package.json</code>、<code>package-lock.json</code>{" "}
          一起保存到应用仓库。 检查忽略规则，确保 <code>npm ci</code>{" "}
          前存在相同相对路径、相同字节的压缩包。
          如果改用私有制品存储，在安装前下载到同一路径，保留锁文件的完整性校验。
        </p>
        <CopyCode
          code={"# 先取得应用锁定的压缩包，再安装\nnpm ci\nnpm run build"}
          title="新环境 / CI · npm"
        />
        <p>
          不要把上面的临时示例目录当作长期依赖地址：文件消失后，空缓存的
          <code>npm ci</code> 会失败。升级时用新的 revision 目录重新安装，
          更新压缩包和锁文件，不要覆盖旧包。此流程只验证 npm，不承诺 pnpm
          的安装行为。
        </p>
      </section>

      <section id="compiler">
        <h2>确认框架编译器</h2>
        <p>
          Ready 保留 TypeScript、TSX、Vue 和 Svelte 源码，由 Vite
          编译，不能直接在 Node 中执行。 已验证的版本是 Vite 7.1.12 和
          TypeScript 5.9.3。已有插件可直接保留，不要重复注册。
        </p>
        <CopyCode
          code={optionalCompilerInstall(framework)}
          title={`${framework} · 可选：仅缺少 Vite 插件时安装`}
        />
        <CopyCode code={setup.config} title={`${framework} · Vite 插件配置`} />
        <p>
          TypeScript 使用 <code>moduleResolution: "Bundler"</code>。
          {compilerNotes[framework]}
        </p>
        {framework === "Vue" && (
          <p className="api-note">
            同页有多个独立 Vue 应用时，在每个应用挂载前设置不同的{" "}
            <code>app.config.idPrefix</code>； 同一应用内不需要逐组件设置。
          </p>
        )}
      </section>

      <section id="first-component">
        <h2>渲染第一个组件</h2>
        <p>
          在入口导入一次主题 CSS。即使没有主题容器，Ready 组件也会使用默认样式；
          可在现有祖先上加主题属性切换局部主题。
        </p>
        <CopyCode
          code={"import '@destyler/ready-prototype/theme.css'"}
          title={`${setup.entry} · 入口样式`}
        />
        <p>
          将下方示例存为 <code>{setup.component}</code>，导入现有 App
          并渲染，保留原来的挂载代码。组件要从框架子路径导入，不要从包根路径导入。
        </p>
        <CopyCode
          code={snippet(framework, "Checkbox")}
          title={`${setup.component} · 最小组件`}
        />
        <p>
          运行项目已有的类型检查、构建和启动命令（如 <code>npm run check</code>
          、<code>npm run build</code>、<code>npm run dev</code>
          ，未定义的命令可跳过）。
          看到带样式的复选框后，再复制其他组件示例。这些操作不会发布包或部署站点。
        </p>
      </section>
    </div>
  );
}

export function ThemeGuide({
  framework,
  onFramework,
  theme,
  onTheme,
}: FrameworkControls & {
  theme: ComponentTheme;
  onTheme: (value: ComponentTheme) => void;
}) {
  return (
    <div className="guide-body">
      <section id="compare">
        <h2>比较内置主题</h2>
        <p>
          Everyday 使用圆角和无衬线字体；Midnight
          使用深绿、衬线字体和较直的边角。
          两个主题共用一套样式变量。这里的主题切换只影响组件，页头的明暗按钮只影响文档。
        </p>
        <div className="guide-controls">
          <FrameworkPicker value={framework} onChange={onFramework} />
          <ThemeSwitch value={theme} onChange={onTheme} />
        </div>
        <div className="preview-panel" data-rd-theme={theme}>
          <LivePreview
            active
            framework={framework}
            component="Select"
            theme={theme}
          />
        </div>
        <p>
          先选一个工作空间，再切换主题：选中项会保留。切换框架会重新挂载并重置示例。{" "}
          <a href="#select">查看 Select 用法与 API</a>
        </p>
      </section>
      <section id="customize">
        <h2>自定义主题</h2>
        <p>
          把示例分别放进现有文件。先导入 Ready CSS，再导入自定义
          CSS；自定义选择器用于覆盖内置变量。
        </p>
        <div className="theme-code-list">
          {themeSnippets.map(({ title, code }) => (
            <CopyCode key={title} code={code} title={title} />
          ))}
        </div>
        <p>
          保留框架的挂载代码，修改现有 <code>#app</code>{" "}
          容器，不要新增第二个同名容器。
        </p>
      </section>
    </div>
  );
}

export function BoundariesGuide() {
  return (
    <div className="guide-body">
      <section id="attributes">
        <h2>原生属性</h2>
        <p className="api-note" data-doc-note="native-attributes">
          只支持文档列出的组件属性。Vue 中未声明的 <code>id</code>、
          <code>aria-label</code>、<code>readonly</code>{" "}
          等可能落到外层元素，不会配置内部原生输入或 Select 触发器。
          其他框架也不承诺外层透传。请使用 <code>label</code>、
          <code>description</code>、<code>disabled</code>、<code>required</code>{" "}
          和 <code>error</code> 表达相应语义。
        </p>
      </section>
      <section id="forms">
        <h2>表单与状态</h2>
        <p>
          Checkbox 和 Select 保留隐藏表单控件、字段名、必填约束及错误关联。SSR
          页面水合前改动表单，输入仍可能丢失或错配。
          恢复示例是实验，不改变默认行为。重置会请求初始值；受控父组件可以接受，也可以保留当前值。
        </p>
        <p>
          Select 的每个选项值必须唯一且非空；组件值 <code>""</code> 表示未选择。
        </p>
      </section>
      <section id="overlays">
        <h2>浮层与主题</h2>
        <p>
          浮层保持在主题作用域中继承变量。避免让祖先裁剪内容、变换坐标或隔离层叠。
          当前未提供通用的跨 portal 主题桥接。
        </p>
        <p>
          React 底层原语的模拟实验中，Dialog 和内嵌 Select 初始同时打开时，一次
          Escape 可能同时关闭两层。这不是 Ready Select
          的公开用法，且未经真实浏览器和其他框架验收； 不要依赖这个嵌套行为。
        </p>
      </section>
      <section id="verification">
        <h2>验证范围</h2>
        <p>
          这是私有试点。四套预览用各自的框架编译器构建，在独立页面中运行，切换框架会卸载旧页面。
          文档中的浮层仅覆盖预览区域。构建通过、类型通过以及模拟交互通过，不等于完整的真实浏览器、
          移动端或辅助技术验收。
        </p>
      </section>
    </div>
  );
}
