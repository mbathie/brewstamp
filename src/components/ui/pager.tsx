import { Button } from "@/components/ui/button";

// "N–M of T" + Previous/Next pager, shared by the dashboard check-ins, customer
// list, and customer-detail history (was triplicated verbatim). Renders nothing
// when everything fits on one page.
export function Pager({
  page,
  pageSize,
  count,
  onPage,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (count <= pageSize) return null;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = page * pageSize;
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {start + 1}–{Math.min(start + pageSize, count)} of {count}
      </p>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer disabled:opacity-50"
          disabled={page === 0}
          onClick={() => onPage(Math.max(0, page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="cursor-pointer disabled:opacity-50"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
