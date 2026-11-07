import { Separator } from "@destyler-ui/solid";
export function Basic() {
  return (
    <div class="parity-stack" style={{ width: "256px" }}>
      <div>
        <h3>shadcn/ui</h3>
        <p class="parity-status">Original New York components.</p>
      </div>
      <Separator.Root />
      <div
        style={{
          display: "flex",
          height: "20px",
          gap: "16px",
          "align-items": "center",
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
