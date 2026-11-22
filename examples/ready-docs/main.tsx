import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  GitFork,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { LivePreview } from "./LivePreview";
import { CopyCode, FrameworkPicker, ThemeSwitch, type Theme } from "./Controls";
import { InstallationGuide, ThemeGuide, BoundariesGuide } from "./Guides";
import {
  apiFor,
  controlledSelectSnippet,
  documentationPages,
  frameworkFromUrl,
  searchDocumentation,
  snippet,
  urlWithFramework,
  type ComponentName,
  type Framework,
} from "./content";
import "../../packages/ready/theme.css";
import "@fontsource-variable/geist";
import "./styles.css";

type Page = (typeof documentationPages)[number]["id"];
type Section = readonly [string, string];
const sections: Record<Page, readonly Section[]> = {
  overview: [["components", "组件"]],
  installation: [
    ["new-project", "新建项目"],
    ["existing-project", "接入已有项目"],
    ["compiler", "编译配置"],
    ["first-component", "渲染第一个组件"],
  ],
  checkbox: [
    ["example", "交互示例"],
    ["usage", "使用方式"],
    ["api", "API"],
  ],
  select: [
    ["example", "交互示例"],
    ["usage", "使用方式"],
    ["controlled", "受控与清空"],
    ["api", "API"],
  ],
  dialog: [
    ["example", "交互示例"],
    ["usage", "使用方式"],
    ["api", "API"],
  ],
  themes: [
    ["compare", "主题比较"],
    ["customize", "自定义主题"],
  ],
  boundaries: [
    ["attributes", "原生属性"],
    ["forms", "表单与数据"],
    ["overlays", "浮层与主题"],
    ["verification", "验证范围"],
  ],
};
function SectionLinks({ page, anchor }: { page: Page; anchor: string }) {
  function focusSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const section = document.getElementById(id);
    const heading = section?.querySelector<HTMLElement>("h2, h3");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start" });
    // Let the real link manage the URL and history, including repeated activation.
  }

  return sections[page].map(([id, title]) => (
    <a
      key={id}
      href={`#${page}/${id}`}
      aria-current={id === anchor ? "location" : undefined}
      onClick={(event) => focusSection(event, id)}
    >
      {title}
    </a>
  ));
}

const groups: { name: string; pages: Page[] }[] = [
  { name: "入门", pages: ["overview", "installation"] },
  { name: "组件", pages: ["checkbox", "select", "dialog"] },
  { name: "设计", pages: ["themes", "boundaries"] },
];
const components = {
  checkbox: {
    name: "Checkbox",
    detail: "勾选与确认",
    description:
      "在选中与未选中之间切换。可以用于独立偏好、表单字段和显式确认。",
    usage:
      "传入可见 label；需要进表单时设置 name。省略 checked 由组件管理状态，表单校验失败时用 error 描述原因。",
  },
  select: {
    name: "Select",
    detail: "单项选择",
    description:
      "从一组选项中选择一个值，支持键盘导航、禁用选项和原生表单提交。",
    usage:
      "提供非空标签和一组 value 唯一且非空的选项。用 name 将值纳入表单；空字符串表示未选择。",
  },
  dialog: {
    name: "Dialog",
    detail: "对话与反馈",
    description:
      "为需要专注完成的操作打开模态对话框，管理焦点并提供清晰的关闭方式。",
    usage:
      "为触发器、标题和关闭按钮提供清晰文字。把操作所需的内容放进 children 或默认插槽；避免仅用颜色表达操作结果。",
  },
} as const;
type ComponentPage = keyof typeof components;
const componentPages = Object.keys(components) as ComponentPage[];
const guideTitles = {
  installation: [
    "开始使用",
    "从源码安装所需框架的 Ready 组件，在自己的 Vite 项目中运行第一个示例。",
  ],
  themes: ["主题", "换一套组件外观，不必换掉行为与 API。"],
  boundaries: [
    "使用边界",
    "了解组件支持的行为，以及目前仍需项目自行处理的情况。",
  ],
} as const;
const titles = Object.fromEntries(
  documentationPages.map((p) => [p.id, p.title]),
) as Record<Page, string>;
const github = "https://github.com/destyler/designs";
const iconProps = { size: 16, strokeWidth: 1.7, "aria-hidden": true as const };
function getRoute() {
  const [raw, anchor = ""] = window.location.hash.slice(1).split("/");
  const page = documentationPages.some((p) => p.id === raw)
    ? (raw as Page)
    : "overview";
  return {
    page,
    anchor: sections[page].some(([id]) => id === anchor) ? anchor : "",
  };
}
function Brand() {
  return (
    <a className="brand" href="#overview" aria-label="Destyler 首页">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M3 5h9l8 11-8 11H3l8-11Z" fill="currentColor" />
        <path d="M16 5h5l8 11-8 11h-5l8-11Z" fill="currentColor" />
      </svg>
      <span>Destyler</span>
      <small>Ready</small>
    </a>
  );
}
function Graphic() {
  // The same profile, shifted through four aligned frames: one interface across four runtimes.
  return (
    <div className="masthead-art" aria-hidden="true">
      <svg viewBox="0 0 460 399" fill="none">
        <defs>
          <pattern
            id="draft-grid"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M22 0H0v22"
              fill="none"
              stroke="currentColor"
              opacity=".18"
            />
          </pattern>
          <path id="profile" d="M0 0h66l100 99L66 198H0l100-99Z" />
        </defs>
        <path d="M22 22h416v352H22z" fill="url(#draft-grid)" />
        <path
          className="art-axis"
          d="M22 198h416M220 22v352M22 22h416v352H22z"
        />
        <path
          className="art-ticks"
          d="M17 22h10m-5-5v10m411-5h10m-5-5v10M17 374h10m-5-5v10m411-5h10m-5-5v10"
        />
        <use href="#profile" x="54" y="99" className="art-layer l1" />
        <use href="#profile" x="103" y="99" className="art-layer l2" />
        <use href="#profile" x="152" y="99" className="art-layer l3" />
        <use href="#profile" x="201" y="99" className="art-layer l4" />
        <path
          d="M58 327h306m-306-4v8m102-8v8m102-8v8m102-8v8"
          className="art-axis"
        />
        <g className="art-type">
          <text x="57" y="350">
            01
          </text>
          <text x="159" y="350">
            02
          </text>
          <text x="261" y="350">
            03
          </text>
          <text x="363" y="350" textAnchor="end">
            04
          </text>
        </g>
      </svg>
    </div>
  );
}
function Specimen({ page }: { page: ComponentPage }) {
  return (
    <svg viewBox="0 0 240 118" className="specimen-drawing" aria-hidden="true">
      {page === "checkbox" ? (
        <g>
          <rect
            x="49"
            y="46"
            width="26"
            height="26"
            rx="6"
            fill="currentColor"
          />
          <path
            d="m56 59 4 4 8-9"
            stroke="var(--specimen-bg)"
            strokeWidth="2.4"
            fill="none"
          />
          <path
            d="M86 54h94m-94 12h58"
            stroke="currentColor"
            strokeWidth="2"
            opacity=".56"
          />
        </g>
      ) : page === "select" ? (
        <g fill="none" stroke="currentColor">
          <rect x="49" y="24" width="142" height="27" rx="6" />
          <path d="M61 37h47m64-2 4 4 4-4" />
          <rect x="49" y="57" width="142" height="39" rx="6" />
          <path d="M62 69h76m-76 13h62" opacity=".56" />
          <path d="m170 70 3 3 6-6" strokeWidth="1.7" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor">
          <rect x="49" y="29" width="141" height="63" rx="7" />
          <path
            d="M61 43h68m-68 12h100m-100 9h65m43-23 7 7m0-7-7 7"
            opacity=".64"
          />
          <rect
            x="136"
            y="71"
            width="40"
            height="11"
            rx="3"
            fill="currentColor"
          />
        </g>
      )}
    </svg>
  );
}
function Home() {
  return (
    <div className="home">
      <section className="masthead">
        <div className="masthead-copy">
          <p className="index-label">
            <span /> DESTYLER READY
          </p>
          <h1>
            组件不必<span>从零组装。</span>
          </h1>
          <p className="masthead-lead">
            为 React、Vue、Solid 和 Svelte
            提供开箱即用的组件。从完整交互开始，用同一套主题系统做出自己的产品。
          </p>
          <div className="masthead-actions">
            <a className="action-main" href="#installation">
              开始使用 <ArrowRight {...iconProps} />
            </a>
            <a className="action-alt" href="#overview/components">
              浏览组件 <ArrowDownRight {...iconProps} />
            </a>
          </div>
        </div>
        <Graphic />
      </section>
      <div className="framework-rail" aria-label="目前支持的框架">
        <span>原生支持</span>
        <ul>
          <li>React</li>
          <li>Vue</li>
          <li>Solid</li>
          <li>Svelte</li>
        </ul>
      </div>
      <section
        className="collection"
        id="components"
        aria-labelledby="collection-title"
      >
        <div className="collection-intro">
          <div>
            <p className="index-label">
              <span /> COMPONENTS
            </p>
            <h2 id="collection-title">从一个组件开始</h2>
          </div>
          <p>每个组件都有真实交互、可复制用法和 API 文档。</p>
        </div>
        <div className="specimens">
          {componentPages.map((id) => (
            <a key={id} className={"specimen " + id} href={`#${id}`}>
              <Specimen page={id} />
              <div>
                <strong>{components[id].name}</strong>
                <span>{components[id].detail}</span>
                <ArrowUpRight {...iconProps} />
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="home-guides" aria-label="更多文档">
        <a href="#themes">
          <p className="index-label">THEMING</p>
          <h2>保留交互，换上你的主题。</h2>
          <p>比较两套内置外观，并学习用 CSS 变量接入自定义主题。</p>
          <ArrowUpRight {...iconProps} />
        </a>
        <a href="#boundaries">
          <p className="index-label">REFERENCE</p>
          <h2>了解支持范围</h2>
          <p>查看表单、浮层和源码包的已知边界。</p>
          <ArrowUpRight {...iconProps} />
        </a>
      </section>
    </div>
  );
}
function ComponentGuide({
  page,
  framework,
  onFramework,
  theme,
  onTheme,
}: {
  page: ComponentPage;
  framework: Framework;
  onFramework: (f: Framework) => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
}) {
  const [mode, setMode] = useState<"preview" | "code">("preview");
  const info = components[page];
  const component: ComponentName = info.name;
  return (
    <section className="guide-body component-guide" id={page}>
      <section id="example" className="doc-section">
        <h2 className="sr-only">交互示例</h2>
        <div className="example">
          <div className="example-top">
            <div className="view-tabs" role="group" aria-label="显示方式">
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
            <FrameworkPicker value={framework} onChange={onFramework} />
          </div>
          <div
            className="preview-panel"
            hidden={mode !== "preview"}
            data-rd-theme={theme}
          >
            <LivePreview
              key={framework}
              framework={framework}
              component={component}
              theme={theme}
            />
          </div>
          <div className="usage-panel" hidden={mode !== "code"}>
            <CopyCode
              code={snippet(framework, component)}
              title={`${component} · ${framework}`}
            />
          </div>
          <div className="example-meta">
            <span>
              <i />
              {framework} 原生预览
            </span>
            <ThemeSwitch value={theme} onChange={onTheme} />
          </div>
        </div>
      </section>
      <section id="usage" className="doc-section">
        <h2>使用方式</h2>
        <p>{info.usage}</p>
        <CopyCode
          code={`import { ${component} } from '@destyler/ready-prototype/${framework.toLowerCase()}'`}
          title="导入组件"
        />
        <p>
          首次接入？先按<a href="#installation">安装指南</a>
          添加所选框架的依赖，并在入口导入主题 CSS。
        </p>
        {page === "select" && (
          <aside className="callout" data-doc-note="disabled-selection">
            <strong>禁用选项与提交值</strong>
            <p>
              已选选项后来被禁用时，界面仍保留它，但列表不允许再次选择它，且原生表单不会提交该值。不要依赖{" "}
              <code>required</code>{" "}
              拒绝这种情况；需要撤回选项时，请清空受控值或提供错误提示，并在服务端校验。Happy
              DOM 的序列化与真实浏览器不同，模拟测试不能替代浏览器验收。
            </p>
          </aside>
        )}
      </section>
      {page === "select" && (
        <section
          id="controlled"
          className="doc-section"
          data-doc-example="controlled-select"
        >
          <h2>受控与清空</h2>
          <p>
            父组件保存并接受组件报告的值。主动清空时传入空字符串，而不是{" "}
            <code>undefined</code>，以保持受控模式。
          </p>
          <div className="controlled-demo" data-rd-theme={theme}>
            <LivePreview
              key={framework}
              framework={framework}
              component="ControlledSelect"
              theme={theme}
            />
          </div>
          <CopyCode
            code={controlledSelectSnippet(framework)}
            title={`Select · ${framework} · 受控与清空`}
          />
        </section>
      )}
      <section className="doc-section" id="api">
        <h2>API</h2>
        <p>
          {framework === "Vue"
            ? "Vue 使用对应的 v-model:checked、v-model:value 或 v-model:open。"
            : "使用对应的值属性与 onCheckedChange、onValueChange 或 onOpenChange 回调。"}{" "}
          省略值属性时由组件管理状态。可访问标签和标题不能是空白。
        </p>
        <div
          className="api-table-wrap"
          tabIndex={0}
          aria-label={`${component} 属性列表`}
        >
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
              {apiFor(framework, component).map(([name, type, description]) => (
                <tr key={name}>
                  <th scope="row">
                    <code>{name}</code>
                  </th>
                  <td>{type}</td>
                  <td>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
function PageLinks({ page, select }: { page: Page; select?: () => void }) {
  return (
    <nav aria-label="文档导航">
      {groups.map((group) => (
        <div className="nav-group" key={group.name}>
          <p>{group.name}</p>
          {group.pages.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={select}
              aria-current={page === id ? "page" : undefined}
            >
              {titles[id]}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
function Modal({
  open,
  close,
  className,
  children,
  label,
}: {
  open: boolean;
  close: () => void;
  className: string;
  children: React.ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>("input")?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-inner">{children}</div>
    </dialog>
  );
}
export function App() {
  const [{ page, anchor }, setRoute] = useState(getRoute);
  const [framework, setFrameworkState] = useState<Framework>(() =>
    frameworkFromUrl(window.location.href),
  );
  const [theme, setTheme] = useState<Theme>("default");
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
    [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false);
  const main = useRef<HTMLElement>(null),
    searchTrigger = useRef<HTMLButtonElement>(null),
    mobileTrigger = useRef<HTMLButtonElement>(null);
  const closeSearch = () => {
    setSearch(false);
    setQuery("");
    requestAnimationFrame(() => searchTrigger.current?.focus());
  };
  const closeMobile = () => {
    setMobile(false);
    requestAnimationFrame(() => mobileTrigger.current?.focus());
  };
  function setFramework(next: Framework) {
    if (next !== framework) {
      window.history.pushState(
        null,
        "",
        urlWithFramework(window.location.href, next),
      );
      setFrameworkState(next);
    }
  }
  useEffect(() => {
    function sync() {
      const next = getRoute();
      setRoute((old) =>
        old.page === next.page && old.anchor === next.anchor ? old : next,
      );
      setFrameworkState(frameworkFromUrl(window.location.href));
      setMobile(false);
      setSearch(false);
      setQuery("");
    }
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (anchor)
        document.getElementById(anchor)?.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [page, anchor]);
  useEffect(() => {
    document.title = `${page === "overview" ? "开箱即用的跨框架组件" : titles[page]} · Destyler Ready`;
  }, [page]);
  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
    try {
      localStorage.setItem("destyler-docs-appearance", appearance);
    } catch {}
  }, [appearance]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (search) closeSearch();
        else {
          setMobile(false);
          setSearch(true);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [search]);
  const results = searchDocumentation(query);
  const componentPage = componentPages.find((id) => id === page);
  const heading = componentPage
    ? components[componentPage].name
    : page === "overview"
      ? ""
      : titles[page];
  const intro = componentPage
    ? components[componentPage].description
    : page === "overview"
      ? ""
      : guideTitles[page as keyof typeof guideTitles][1];
  const index = documentationPages.findIndex((p) => p.id === page);
  const prev = documentationPages[index - 1],
    next = documentationPages[index + 1];
  return (
    <div className={`site ${page === "overview" ? "is-home" : "is-doc"}`}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
          main.current?.scrollIntoView();
        }}
      >
        跳到正文
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="header-nav" aria-label="主导航">
            <a
              href="#installation"
              aria-current={page === "installation" ? "page" : undefined}
            >
              文档
            </a>
            <a
              href="#overview/components"
              aria-current={componentPage ? "page" : undefined}
            >
              组件
            </a>
            <a
              href="#themes"
              aria-current={page === "themes" ? "page" : undefined}
            >
              主题
            </a>
          </nav>
          <div className="header-tools">
            <button
              type="button"
              className="search-trigger"
              ref={searchTrigger}
              onClick={() => setSearch(true)}
              aria-label="搜索文档"
            >
              <Search {...iconProps} />
              <span>搜索</span>
              <kbd>⌘ K</kbd>
            </button>
            <a
              className="icon-button github-link"
              href={github}
              aria-label="GitHub 源码"
            >
              <GitFork {...iconProps} />
            </a>
            <button
              className="icon-button"
              type="button"
              aria-label={
                appearance === "light" ? "切换深色文档" : "切换浅色文档"
              }
              onClick={() =>
                setAppearance((x) => (x === "light" ? "dark" : "light"))
              }
            >
              {appearance === "light" ? (
                <Moon {...iconProps} />
              ) : (
                <Sun {...iconProps} />
              )}
            </button>
            <button
              className="icon-button mobile-toggle"
              type="button"
              aria-label="打开导航"
              aria-expanded={mobile}
              ref={mobileTrigger}
              onClick={() => setMobile(true)}
            >
              <Menu {...iconProps} />
            </button>
          </div>
        </div>
      </header>
      {page === "overview" ? (
        <main id="main-content" data-page={page} tabIndex={-1} ref={main}>
          <Home />
        </main>
      ) : (
        <div className="docs-grid">
          <aside className="sidebar">
            <PageLinks page={page} />
          </aside>
          <main id="main-content" data-page={page} tabIndex={-1} ref={main}>
            <header className="page-intro">
              <p className="breadcrumb">
                <a href="#overview">Ready</a>
                <span>/</span>
                {componentPage
                  ? "组件"
                  : page === "installation"
                    ? "入门"
                    : "设计"}
              </p>
              <h1>{heading}</h1>
              <p>{intro}</p>
            </header>
            <details className="mobile-toc">
              <summary>本页内容</summary>
              <nav aria-label="本页目录">
                <SectionLinks page={page} anchor={anchor} />
              </nav>
            </details>
            {componentPage && (
              <ComponentGuide
                key={componentPage}
                page={componentPage}
                framework={framework}
                onFramework={setFramework}
                theme={theme}
                onTheme={setTheme}
              />
            )}
            {page === "installation" && (
              <InstallationGuide
                framework={framework}
                onFramework={setFramework}
              />
            )}
            {page === "themes" && (
              <ThemeGuide
                framework={framework}
                onFramework={setFramework}
                theme={theme}
                onTheme={setTheme}
              />
            )}
            {page === "boundaries" && <BoundariesGuide />}
            <nav className="page-turn" aria-label="相邻文档">
              {prev ? (
                <a href={`#${prev.id}`}>
                  <ArrowLeft {...iconProps} />
                  <span>
                    <small>上一页</small>
                    {prev.title}
                  </span>
                </a>
              ) : (
                <span />
              )}
              {next && (
                <a href={`#${next.id}`}>
                  <span>
                    <small>下一页</small>
                    {next.title}
                  </span>
                  <ArrowRight {...iconProps} />
                </a>
              )}
            </nav>
          </main>
          <aside className="toc" aria-label="本页目录">
            <p>本页内容</p>
            <SectionLinks page={page} anchor={anchor} />
          </aside>
        </div>
      )}
      <footer className="footer">
        <div>
          <Brand />
          <p>基于 Destyler · 私有源码预览</p>
          <a href={github}>
            GitHub <ArrowUpRight {...iconProps} />
          </a>
        </div>
      </footer>
      <Modal
        open={mobile}
        close={closeMobile}
        className="mobile-dialog"
        label="文档导航"
      >
        <div className="modal-heading">
          <strong>文档导航</strong>
          <button type="button" onClick={closeMobile}>
            关闭
          </button>
        </div>
        <PageLinks page={page} select={() => setMobile(false)} />
      </Modal>
      <Modal
        open={search}
        close={closeSearch}
        className="search-dialog"
        label="搜索文档"
      >
        <div className="search-input-row">
          <Search {...iconProps} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索组件或关键词…"
            aria-label="搜索关键词"
          />
          <button type="button" onClick={closeSearch}>
            关闭
          </button>
        </div>
        <div className="search-results">
          {results.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => {
                setSearch(false);
                setQuery("");
                requestAnimationFrame(() => main.current?.focus());
              }}
            >
              <span>{title}</span>
              <ArrowUpRight {...iconProps} />
            </a>
          ))}
          {results.length === 0 && (
            <p>没有匹配页面。试试“受控”“安装”或组件名。</p>
          )}
        </div>
      </Modal>
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
