import { ScrollArea } from "@destyler-ui/solid";
export function Basic() {
  return (
    <ScrollArea.Root>
      <ScrollArea.Viewport>
        <ScrollArea.Content>
          <div style={{ padding: "16px", "min-width": "256px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Tags</h3>
            {Array.from({ length: 50 }, (_, index) => (
              <div
                style={{
                  padding: "8px 0",
                  "border-bottom": "1px solid var(--border)",
                }}
              >
                v1.2.0-beta.{50 - index}
              </div>
            ))}
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb orientation="vertical" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb orientation="horizontal" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}
