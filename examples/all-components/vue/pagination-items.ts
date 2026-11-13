// Match the reference demo window without changing the library pagination policy.
export function paginationItems(page: number): Array<{ type: "page"; value: number } | { type: "ellipsis" }> {
  const pages = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(n => n > 1 && n < 10), 10])].sort((a, b) => a - b);
  return pages.flatMap((value, index): Array<{ type: "page"; value: number } | { type: "ellipsis" }> => [
    ...(index > 0 && value - pages[index - 1] > 1 ? [{ type: "ellipsis" as const }] : []),
    { type: "page", value },
  ]);
}
