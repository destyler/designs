# Pagination gallery window correction

The reference application shows the first and last pages plus two neighbors of
the current page. Native pagination instead pads its edge window: on page 1 it
rendered 1–7, an ellipsis, and 10; the reference shows 1–3, an ellipsis, and 10.
The discrepancy was reproduced in the React hydration suite before the fix.

Each framework now computes the reference application's display window locally,
while retaining native Pagination.Item, Ellipsis, previous/next controls and page
state. Library defaults and pinned upstream shadcn files are unchanged. The small
framework-local helper is included by the exact-source exporter and checked for
identical contents across frameworks.

Tests assert all ten windows, gap counts, current-page ARIA and selected output,
then navigate forward to the last page and backward to the first page in all four
frameworks, including disabled boundary controls. This is simulated DOM evidence,
not real-browser layout, keyboard, pointer or assistive-technology approval.
