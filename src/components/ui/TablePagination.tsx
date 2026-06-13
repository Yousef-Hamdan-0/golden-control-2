import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";

interface TablePaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  itemLabel: string;
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

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-content-muted">
      <span>
        عرض {start}-{end} من أصل {total} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
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
        {Array.from({ length: pages }).map((_, index) => (
          <Button
            key={index}
            type="button"
            size="sm"
            variant={currentPage === index + 1 ? "primary" : "outline"}
            className="h-8 w-8 px-0"
            onClick={() => onPage(index + 1)}
          >
            {index + 1}
          </Button>
        ))}
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
