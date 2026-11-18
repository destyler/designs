import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LivePreview } from "./LivePreview";
import { tokenizeSource } from "../shadcn/components/source-view";
import "../../packages/ready/theme.css";
import "@fontsource-variable/geist";
import "./styles.css";
import {
  frameworks,
  snippet,
  controlledSelectSnippet,
  install,
  themeSnippets,
  apiFor,
  type Framework,
  type ComponentName,
} from "./content";

function CopyCode({
  code,
  title = "示例代码",
}: {
  code: string;
  title?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const generation = useRef(0);
  useLayoutEffect(() => {
    generation.current++;
    setState("idle");
    return () => {
      generation.current++;
    };
  }, [code]);
  useEffect(() => {
    if (state === "idle") return;
    const id = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(id);
  }, [state]);
  async function copy() {
    const request = ++generation.current;
    try {
      await navigator.clipboard.writeText(code);
      if (request === generation.current) setState("copied");
    } catch {
      if (request === generation.current) setState("failed");
    }
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>
          <span className="code-dot" />
          {title}
        </span>
        <button type="button" onClick={copy} aria-label={`复制${title}`}>
          {state === "copied"
            ? "已复制 ✓"
            : state === "failed"
              ? "复制失败，请手动选择"
              : "复制代码 ↗"}
        </button>
        <span className="sr-only" role="status">
          {state === "copied"
            ? "代码已复制"
            : state === "failed"
              ? "无法访问剪贴板，请手动选择代码"
              : ""}
        </span>
      </div>
      <pre tabIndex={0} aria-label={title}>
        <code>
          {tokenizeSource(code).map((token, i) => (
            <span
              key={i}
              className={token.kind ? `syntax-${token.kind}` : undefined}
            >
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
function FrameworkPicker({
  value,
  onChange,
}: {
  value: Framework;
  onChange: (value: Framework) => void;
}) {
  return (
    <div className="frameworks" role="group" aria-label="预览与代码框架">
      {frameworks.map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={f === value}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
const pageFromHash = () => {
  const page = window.location.hash.slice(1);
  return [
    "overview",
    "installation",
    "checkbox",
    "select",
    "dialog",
    "themes",
    "boundaries",
  ].includes(page)
    ? page
    : "overview";
};
export function App() {
  const [framework, setFramework] = useState<Framework>("React"),
    [theme, setTheme] = useState<"default" | "midnight">("default"),
    [nav, setNav] = useState(false);
  const [page, setPage] = useState(pageFromHash);
  const [appearance, setAppearance] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("destyler-docs-appearance") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null),
    searchTrigger = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null),
    sideNav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (nav) sideNav.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [nav]);
  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
    try {
      localStorage.setItem("destyler-docs-appearance", appearance);
    } catch {}
  }, [appearance]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (search) {
          setSearch(false);
          searchTrigger.current?.focus();
        } else {
          setNav(false);
          setSearch(true);
        }
      }
      if (e.key === "Escape") {
        if (search) {
          setSearch(false);
          searchTrigger.current?.focus();
        }
        if (nav) {
          setNav(false);
          mobileTrigger.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [search, nav]);
  useEffect(() => {
    if (search) searchInput.current?.focus();
  }, [search]);
  useEffect(() => {
    document.title = `${({ overview: "组件，为产品而生", installation: "开始使用", checkbox: "Checkbox", select: "Select", dialog: "Dialog", themes: "主题", boundaries: "使用边界" } as Record<string, string>)[page]} — Destyler`;
  }, [page]);
  const [homeComponent, setHomeComponent] = useState<ComponentName>("Select");
  const [homeMode, setHomeMode] = useState<"preview" | "code">("preview");
  const [mode, setMode] = useState<"preview" | "code">("preview");
  useEffect(() => {
    const change = () => {
      setPage(pageFromHash());
      setNav(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const links = [
    ["overview", "概览"],
    ["installation", "开始使用"],
    ["checkbox", "Checkbox"],
    ["select", "Select"],
    ["dialog", "Dialog"],
    ["themes", "主题"],
    ["boundaries", "使用边界"],
  ];
  return (
    <div className={`docs-shell ${page === "overview" ? "is-home" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
          document.getElementById("main-content")?.scrollIntoView();
        }}
      >
        跳到正文
      </a>
      <header className="site-header">
        <a className="brand" href="#overview">
          <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h8l10 8-10 8H3l10-8z" fill="currentColor" />
          </svg>
          <span>
            destyler<span className="brand-product"> / designs</span>
          </span>
        </a>
        <nav className="header-nav" aria-label="主导航">
          <a href="#installation">文档</a>
          <a href="#checkbox">组件</a>
          <a href="#themes">主题</a>
        </nav>
        <div className="header-tools">
          <button
            ref={searchTrigger}
            type="button"
            className="search-trigger"
            onClick={() => {
              setNav(false);
              setSearch(true);
            }}
          >
            <span>搜索文档…</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            type="button"
            className="appearance-button"
            aria-label={
              appearance === "light" ? "切换深色文档" : "切换浅色文档"
            }
            onClick={() =>
              setAppearance((x) => (x === "light" ? "dark" : "light"))
            }
          >
            {appearance === "light" ? "◐" : "◑"}
          </button>
          <a className="github-link" href="https://github.com/destyler/designs">
            GitHub ↗
          </a>
          <button
            ref={mobileTrigger}
            className="mobile-toggle"
            type="button"
            onClick={() => setNav(!nav)}
            aria-expanded={nav}
            aria-label={nav ? "关闭导航" : "打开导航"}
          >
            {nav ? "×" : "☰"}
          </button>
        </div>
      </header>
      {nav && (
        <button
          className="nav-scrim"
          type="button"
          aria-label="关闭文档导航"
          onClick={() => {
            setNav(false);
            mobileTrigger.current?.focus();
          }}
        />
      )}
      <aside
        className={`sidebar ${nav ? "is-open" : ""}`}
        aria-label="文档导航"
        ref={sideNav}
        onKeyDown={(e) => {
          if (nav && e.key === "Tab") {
            const links =
              e.currentTarget.querySelectorAll<HTMLAnchorElement>("a");
            if (e.shiftKey && document.activeElement === links[0]) {
              e.preventDefault();
              links[links.length - 1]?.focus();
            } else if (
              !e.shiftKey &&
              document.activeElement === links[links.length - 1]
            ) {
              e.preventDefault();
              links[0]?.focus();
            }
          }
        }}
      >
        <nav>
          {links.map(([id, title], i) => (
            <Fragment key={id}>
              {[0, 2, 5].includes(i) && (
                <div className="sidebar-label">
                  {i === 0 ? "开始" : i === 2 ? "组件" : "设计"}
                </div>
              )}
              <a
                href={`#${id}`}
                aria-current={page === id ? "page" : undefined}
                key={id}
                onClick={() => {
                  setNav(false);
                  document.getElementById("main-content")?.focus();
                }}
              >
                <span className="nav-icon" aria-hidden="true">
                  {["◈", "↗", "☑", "▤", "▣", "◐", "◇"][i]}
                </span>
                {title}
              </a>
            </Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-label">框架无关，体验一致。</span>
          <p>React · Vue · Solid · Svelte</p>
          <a href="https://github.com/destyler/designs">查看源代码 ↗</a>
        </div>
      </aside>
      <div className="main-column">
        <main id="main-content" tabIndex={-1} data-page={page}>
          <section className="hero" id="overview">
            <div className="hero-copy">
              <p className="hero-eyebrow">介绍</p>
              <h1 className="editorial-title">组件，回归产品本身。</h1>
              <p className="hero-description">
                完整的交互，开放的设计。为 React、Vue、Solid 和 Svelte
                提供开箱即用的组件，让你专注于产品本身。
              </p>
              <div className="hero-actions">
                <a className="primary-link" href="#installation">
                  开始使用 <span>→</span>
                </a>
                <a className="secondary-link" href="#themes">
                  了解主题
                </a>
              </div>
            </div>
            <section className="home-live" aria-labelledby="home-live-title">
              <div className="home-live-heading">
                <h2 id="home-live-title">交互示例</h2>
                <p>同一套 API，四种原生实现。试试下面的组件。</p>
              </div>
              <div className="home-workspace">
                <div
                  className="home-component-picker"
                  role="group"
                  aria-label="首页示例组件"
                >
                  {(["Checkbox", "Select", "Dialog"] as ComponentName[]).map(
                    (name, i) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={homeComponent === name}
                        onClick={() => setHomeComponent(name)}
                      >
                        {name}
                      </button>
                    ),
                  )}
                  <a href={`#${homeComponent.toLowerCase()}`}>
                    用法与 API <span>→</span>
                  </a>
                </div>
                <div className="home-workbench">
                  <div className="home-preview-controls">
                    <FrameworkPicker
                      value={framework}
                      onChange={setFramework}
                    />
                    <div
                      className="view-tabs"
                      role="group"
                      aria-label="首页显示方式"
                    >
                      <button
                        type="button"
                        aria-pressed={homeMode === "preview"}
                        onClick={() => setHomeMode("preview")}
                      >
                        预览
                      </button>
                      <button
                        type="button"
                        aria-pressed={homeMode === "code"}
                        onClick={() => setHomeMode("code")}
                      >
                        代码
                      </button>
                    </div>
                  </div>
                  <div
                    className="home-live-stage"
                    hidden={homeMode !== "preview"}
                    data-rd-theme={theme}
                  >
                    <LivePreview
                      active={page === "overview"}
                      framework={framework}
                      component={homeComponent}
                      theme={theme}
                    />
                  </div>
                  <div className="home-source" hidden={homeMode !== "code"}>
                    <CopyCode
                      code={snippet(framework, homeComponent)}
                      title={`${framework} · ${homeComponent}`}
                    />
                  </div>
                  <div className="home-workbench-footer">
                    <div
                      className="theme-switch"
                      role="group"
                      aria-label="首页预览主题"
                    >
                      <button
                        type="button"
                        aria-pressed={theme === "default"}
                        onClick={() => setTheme("default")}
                      >
                        <span className="swatch swatch-light" />
                        Everyday
                      </button>
                      <button
                        type="button"
                        aria-pressed={theme === "midnight"}
                        onClick={() => setTheme("midnight")}
                      >
                        <span className="swatch swatch-dark" />
                        Midnight
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="home-live-note">
                预览与代码来自同一示例。切换框架会重新挂载，切换主题保留当前选择。
              </p>
            </section>
            <section className="home-library" aria-labelledby="library-title">
              <h2 id="library-title">组件文档</h2>
              <p>从一个组件开始。查看用法、交互示例与完整 API。</p>
            </section>
            <div className="component-index">
              {(["Checkbox", "Select", "Dialog"] as ComponentName[]).map(
                (name, i) => (
                  <a href={`#${name.toLowerCase()}`} key={name}>
                    <strong>{name}</strong>
                    <span>{["选择与确认", "选项与表单", "对话与反馈"][i]}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ),
              )}
            </div>
            <div className="home-footnote">
              <p>
                基于 Destyler
                交互基础构建。当前提供三个组合组件，源码包尚未发布到 npm。
              </p>
              <a href="#boundaries">了解当前能力与边界 →</a>
            </div>
          </section>
          <section className="setup-section" id="installation">
            <div className="section-kicker">GET STARTED</div>
            <h2>开始使用</h2>
            <p>
              这是私有的 Vite 源码包，尚未发布到 npm。推荐 Node 24.22.1 与 npm
              11.9.0（已验证），并需要当前 designs 仓库。Node 22 分支至少需要
              22.22.3，该最低版本尚未运行验证；不要使用 Node
              23。下面的命令会打包本地组件，并生成所选框架的独立应用。
            </p>
            <FrameworkPicker value={framework} onChange={setFramework} />
            <CopyCode
              code={install(framework)}
              title={`${framework} · 本地安装`}
            />
            <div className="info-strip">
              <span aria-hidden="true">↳</span>
              <p>
                在应用入口导入 <code>@destyler/ready-prototype/theme.css</code>
                即可获得默认组件样式，无需额外主题容器。可在现有祖先上设置
                <code>data-rd-theme="default"</code> 或 midnight
                切换局部主题。生成器保留显式主题示例；React /
                Solid：把下方代码保存为 Example.tsx，在生成的入口导入 Example
                并渲染 Example 组件，保留挂载、CSS 和主题容器。Vue /
                Svelte：替换 App.vue / App.svelte
                中的组件内容，并保留入口主题设置。
              </p>
            </div>
            {framework === "Vue" && (
              <p className="api-note">
                同页有多个独立 Vue 应用时，每个应用必须在挂载前设置不同的
                app.config.idPrefix；同一个应用内的多个 Ready
                组件不需要逐个设置。
              </p>
            )}
          </section>
          <div className="component-intro">
            <div className="breadcrumb">
              文档 <span>/</span> 组件
            </div>
          </div>
          {(["Checkbox", "Select", "Dialog"] as ComponentName[]).map(
            (component, i) => (
              <section
                className="component-section"
                id={component.toLowerCase()}
                key={component}
              >
                <div className="component-heading">
                  <div className="component-number">0{i + 1}</div>
                  <div>
                    <h1>{component}</h1>
                    <p>
                      {
                        [
                          "在选中与未选中之间切换，支持表单、受控状态与错误提示。",
                          "从一组选项中选择一个值，支持键盘导航和原生表单提交。",
                          "在当前页面展示需要关注的内容，管理焦点并提供清晰的关闭方式。",
                        ][i]
                      }
                    </p>
                  </div>
                </div>
                <div className="example-toolbar">
                  <div
                    className="view-tabs"
                    role="group"
                    aria-label={`${component} 显示方式`}
                  >
                    <button
                      type="button"
                      aria-pressed={mode === "preview"}
                      onClick={() => setMode("preview")}
                    >
                      预览
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "code"}
                      onClick={() => setMode("code")}
                    >
                      代码
                    </button>
                  </div>
                  <div className="example-settings">
                    <FrameworkPicker
                      value={framework}
                      onChange={setFramework}
                    />{" "}
                    <div
                      className="theme-switch"
                      role="group"
                      aria-label="交互预览主题"
                    >
                      <button
                        type="button"
                        aria-pressed={theme === "default"}
                        onClick={() => setTheme("default")}
                      >
                        <span className="swatch swatch-light" />
                        Everyday
                      </button>
                      <button
                        type="button"
                        aria-pressed={theme === "midnight"}
                        onClick={() => setTheme("midnight")}
                      >
                        <span className="swatch swatch-dark" />
                        Midnight
                      </button>
                    </div>
                  </div>
                </div>
                <div className="component-workbench">
                  <div
                    className="preview-panel"
                    hidden={mode !== "preview"}
                    data-rd-theme={theme}
                  >
                    <LivePreview
                      active={page === component.toLowerCase()}
                      key={`${framework}-${component}`}
                      framework={framework}
                      component={component}
                      theme={theme}
                    />
                    <div className="preview-footer sr-only">
                      {framework} · 原生交互预览
                    </div>
                  </div>
                  <div className="usage-panel" hidden={mode !== "code"}>
                    <p className="api-note">
                      最简非受控用法：状态由组件内部管理。此代码也是上方真实预览的构建来源。
                    </p>
                    <CopyCode
                      code={snippet(framework, component)}
                      title={`${component} · ${framework} · 非受控`}
                    />
                  </div>
                </div>
                {component === "Select" && (
                  <p className="api-note" data-doc-note="disabled-selection">
                    <strong className="note-title">禁用选项与提交值</strong>
                    已选中的选项后来被禁用，仍会显示并保留选中状态，但不能从列表重新选择。按原生表单规则，禁用选项不会作为该字段的提交值；不要依赖
                    required 拒绝这个状态。撤回选项时请显式清空受控 value 或提供
                    error，并在服务端校验。现有 Happy DOM
                    测试对禁用选项的序列化与浏览器不同，尚不代表真实浏览器提交验收。
                  </p>
                )}
                <details className="api-details" open>
                  <summary>
                    API 与受控用法 <span>+</span>
                  </summary>
                  <div className="api-table-wrap">
                    <table>
                      <caption className="sr-only">{component} 属性</caption>
                      <thead>
                        <tr>
                          <th>属性</th>
                          <th>类型</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiFor(framework, component).map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell, j) => (
                              <td key={j}>
                                {j === 0 ? <code>{cell}</code> : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="api-note">
                    {framework === "Vue"
                      ? "Vue 使用 v-model:checked、v-model:value、v-model:open，对应所选组件。"
                      : "React、Solid、Svelte 使用相应的值属性与 onCheckedChange / onValueChange / onOpenChange 回调。"}{" "}
                    省略值属性时由组件内部管理状态。label、trigger、title、closeLabel
                    等可访问文本不能是空白。
                  </p>
                  {component === "Select" && (
                    <div data-doc-example="controlled-select">
                      <h4>受控 Select：接受更新，也能主动清空</h4>
                      <p className="api-note">
                        下面是完整的组件文件，按开始使用中的入口方式渲染，并保留主题容器。父组件保存
                        value 并接受更新；清空按钮把它设为非 undefined
                        的空字符串，仍保持受控模式。Vue 使用
                        v-model:value，Svelte 使用值属性和回调，不使用
                        bind:value。撤回某个已选选项时，也可以由父组件执行同样的清空操作；此例不自动处理远程数据或提交校验。
                      </p>
                      <LivePreview
                        active={page === "select"}
                        key={`${framework}-controlled`}
                        framework={framework}
                        component="ControlledSelect"
                        theme={theme}
                      />
                      <CopyCode
                        code={controlledSelectSnippet(framework)}
                        title={`Select · ${framework} · 受控与清空`}
                      />
                    </div>
                  )}
                </details>
              </section>
            ),
          )}
          <section className="theme-section" id="themes">
            <div>
              <div className="section-kicker">ONE CONTRACT, TWO CHARACTERS</div>
              <h2>
                换一种气质。
                <br />
                不用换一套组件。
              </h2>
              <p>
                Everyday 的圆角与无衬线字体，Midnight
                的深绿、衬线与利落边缘，都来自同一套语义变量。顶部主题开关只改变预览主题，组件状态会保留。
              </p>
              <div className="theme-cards">
                <button
                  type="button"
                  className="theme-card light-card"
                  onClick={() => setTheme("default")}
                  aria-pressed={theme === "default"}
                >
                  <span>Aa</span>
                  <strong>Everyday</strong>
                  <small>轻盈 · 圆润 · 熟悉</small>
                </button>
                <button
                  type="button"
                  className="theme-card dark-card"
                  onClick={() => setTheme("midnight")}
                  aria-pressed={theme === "midnight"}
                >
                  <span>Aa</span>
                  <strong>Midnight</strong>
                  <small>沉静 · 清晰 · 编辑感</small>
                </button>
              </div>
            </div>
            <div className="theme-code-list">
              {themeSnippets.map((item) => (
                <CopyCode
                  key={item.title}
                  code={item.code}
                  title={item.title}
                />
              ))}
              <p className="api-note">
                以上分别放入现有文件，不要拼接成一个文件。保留框架原有挂载代码；index.html
                示例替换原有 #app
                容器，不要新增第二个同名容器。自定义选择器提高了优先级，可覆盖内置主题变量。
              </p>
            </div>
          </section>
          <section className="boundaries" id="boundaries">
            <div className="section-kicker">HONEST BY DESIGN</div>
            <h2>知道边界，才能放心使用。</h2>
            <p className="api-note" data-doc-note="native-attributes">
              只支持文档列出的组件属性，不保证任意原生属性转发。Vue 未声明的
              id、aria-label、readonly
              等可能落到外层包装元素，不会因此配置内部原生输入或 Select
              触发器；其他框架也不承诺同样的包装层透传。请使用
              label、description、disabled、required、error
              表达对应语义，当前没有通用原生属性转发 API。
            </p>
            <div className="boundary-grid">
              <article>
                <span>01 / 表单与数据</span>
                <h4>状态由你掌握</h4>
                <p>
                  Checkbox 和 Select 保留隐藏表单控件、name、required
                  与错误关联。SSR
                  页面完成水合前修改表单，输入仍可能丢失或错配；现有恢复示例只是实验，未修复默认行为。reset
                  会请求初始值；受控父组件决定接受或保留当前值。options 中每个
                  option.value 必须唯一且非空；组件 value="" 表示未选择。
                </p>
              </article>
              <article>
                <span>02 / 浮层与主题</span>
                <h4>先保持同一作用域</h4>
                <p>
                  浮层保留在主题容器内部，以继承变量。请避免把容器放在会裁剪内容、创建变换坐标或隔离层叠的祖先中。通用跨
                  portal 主题桥接尚未提供。React 模拟测试发现：Dialog 与内嵌
                  Select 初始同时打开时，一次 Escape
                  可能同时关闭两层；尚未完成真实浏览器及其他框架验证，不应依赖该嵌套行为。
                </p>
              </article>
              <article>
                <span>03 / 验证范围</span>
                <h4>不把测试当成承诺</h4>
                <p>
                  当前是私有试点。四框架预览分别使用对应编译器构建，并在独立预览页面运行，切换时卸载旧页面。构建、类型与模拟交互不等于完整的真实浏览器、移动端或辅助技术验收。浮层在预览区域内展示，不会覆盖文档整页。
                </p>
              </article>
            </div>
          </section>
          <footer className="footer">
            <a href="#overview" className="footer-brand">
              destyler<span> / designs</span>
            </a>
            <span>用细节，成就体验。</span>
            <a href="https://github.com/destyler/designs">GitHub ↗</a>
          </footer>
        </main>
      </div>
      {search && (
        <div
          className="search-overlay"
          onClick={() => {
            setSearch(false);
            searchTrigger.current?.focus();
          }}
        >
          <div
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="搜索文档"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const nodes =
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "input,a,button",
                  );
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="search-input-row">
              <input
                ref={searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索组件与文档…"
                aria-label="搜索关键词"
              />
              <button
                type="button"
                onClick={() => {
                  setSearch(false);
                  searchTrigger.current?.focus();
                }}
              >
                关闭
              </button>
            </div>
            <div className="search-results">
              {links
                .filter(([id, title]) =>
                  (id + " " + title)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map(([id, title]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={() => {
                      setSearch(false);
                      setQuery("");
                      searchTrigger.current?.focus();
                    }}
                  >
                    <span>{title}</span>
                    <span>↗</span>
                  </a>
                ))}
              {!links.some(([id, title]) =>
                (id + " " + title).toLowerCase().includes(query.toLowerCase()),
              ) && <p>没有找到相关文档，试试组件名称。</p>}
            </div>
            <div className="search-hint">Tab 选择 · Enter 打开 · Esc 关闭</div>
          </div>
        </div>
      )}
    </div>
  );
}
export function mountReadyDocs(target: HTMLElement) {
  const root = createRoot(target);
  root.render(<App />);
  return root;
}
const target = document.getElementById("root");
if (target) mountReadyDocs(target);
