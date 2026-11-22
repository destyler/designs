import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { tokenizeSource } from "../shadcn/components/source-view";
import { frameworks, type Framework } from "./content";
export function CopyCode({
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
export function FrameworkPicker({
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
export type Theme = "default" | "midnight";
export function ThemeSwitch({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (theme: Theme) => void;
}) {
  return (
    <label className="theme-control">
      <span>组件主题</span>
      <select value={value} onChange={(e) => onChange(e.target.value as Theme)}>
        <option value="default">Everyday</option>
        <option value="midnight">Midnight</option>
      </select>
    </label>
  );
}
