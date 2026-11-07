import { Separator } from "@destyler-ui/react";
export function Basic() {
  return (
    <div className="parity-stack" style={{ width: "256px" }}>
      <div>
        <h3>shadcn/ui</h3>
        <p className="parity-status">Original New York components.</p>
      </div>
      <Separator.Root />
      <div
        style={{
          display: "flex",
          height: "20px",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <span>Blog</span>
        <Separator.Root orientation="vertical" />
        <span>Docs</span>
        <Separator.Root orientation="vertical" />
        <span>Source</span>
      </div>
    </div>
  );
}
