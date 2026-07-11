import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";

interface TablePaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  itemLabel: string;
}

const ELLIPSIS = "…";

/**
 * Windowed page list: always shows first/last and the current page ±1, with
 * an ellipsis for the gaps. Keeps the control compact for large datasets
 * instead of rendering one button per page.
 */
function pageWindow(currentPage: number, pages: number): Array<number | typeof ELLIPSIS> {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items: Array<number | typeof ELLIPSIS> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pages - 1, currentPage + 1);

  if (start > 2) items.push(ELLIPSIS);
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < pages - 1) items.push(ELLIPSIS);

  items.push(pages);
  return items;
}

export function TablePagination({
  page,
  total,
  pageSize,
  onPage,
  itemLabel,
}: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const window = pageWindow(currentPage, pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-content-muted">
      <span>
        عرض {start}-{end} من أصل {total} {itemLabel}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 px-0"
          disabled={currentPage <= 1}
          onClick={() => onPage(currentPage - 1)}
          aria-label="السابق"
        >
          <Icon name="chevron-right" size={16} />
        </Button>
        {window.map((item, index) =>
          item === ELLIPSIS ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-content-muted"
              aria-hidden
            >
              {ELLIPSIS}
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={currentPage === item ? "primary" : "outline"}
              className="h-8 w-8 px-0"
              onClick={() => onPage(item)}
              aria-label={`صفحة ${item}`}
              aria-current={currentPage === item ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 px-0"
          disabled={currentPage >= pages}
          onClick={() => onPage(currentPage + 1)}
          aria-label="التالي"
        >
          <Icon name="chevron-left" size={16} />
        </Button>
      </div>
    </div>
  );
}
