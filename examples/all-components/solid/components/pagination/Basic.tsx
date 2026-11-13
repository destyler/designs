import { paginationItems } from "../../pagination-items";
import { Pagination } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [page, setPage] = createSignal(1);
  return (
    <div class="parity-stack">
      <Pagination.Root
        count={100}
        pageSize={10}
        siblingCount={2}
        page={page()}
        onPageChange={(details) => setPage(details.page)}
      >
        <Pagination.PrevTrigger>Previous</Pagination.PrevTrigger>
        <Pagination.Context>
          {(api) => (
            <>
              {paginationItems(api().page).map((item, index) =>
                item.type === "page" ? (
                  <Pagination.Item value={item.value} type="page">
                    {item.value}
                  </Pagination.Item>
                ) : (
                  <Pagination.Ellipsis index={index}>…</Pagination.Ellipsis>
                ),
              )}
            </>
          )}
        </Pagination.Context>
        <Pagination.NextTrigger>Next</Pagination.NextTrigger>
      </Pagination.Root>
      <p role="status" class="parity-status">
        Page {page()} of 10 · 100 items
      </p>
    </div>
  );
}
