import { cn } from "@/lib/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold",
        className,
      )}
      role="status"
      aria-label="جارٍ التحميل"
    />
  );
}

export function SkeletonRow({ cols = 7 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        </td>
      ))}
    </tr>
  );
}
