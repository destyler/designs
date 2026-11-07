import { Pagination } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [page, setPage] = useState(1);
  return (
    <div className="parity-stack">
      <Pagination.Root
        count={100}
        pageSize={10}
        siblingCount={2}
        page={page}
        onPageChange={(details) => setPage(details.page)}
      >
        <Pagination.PrevTrigger>Previous</Pagination.PrevTrigger>
        <Pagination.Context>
          {(api) => (
            <>
              {api.pages.map((item, index) =>
                item.type === "page" ? (
                  <Pagination.Item
                    key={item.value}
                    value={item.value}
                    type="page"
                  >
                    {item.value}
                  </Pagination.Item>
                ) : (
                  <Pagination.Ellipsis key={`gap-${index}`} index={index}>
                    …
                  </Pagination.Ellipsis>
                ),
              )}
            </>
          )}
        </Pagination.Context>
        <Pagination.NextTrigger>Next</Pagination.NextTrigger>
      </Pagination.Root>
      <p role="status" className="parity-status">
        Page {page} of 10 · 100 items
      </p>
    </div>
  );
}
