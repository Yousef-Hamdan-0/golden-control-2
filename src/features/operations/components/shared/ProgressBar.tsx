export function ProgressBar({ value }: { value: number }) {
  const widthClass =
    value >= 90
      ? "w-full"
      : value >= 75
        ? "w-3/4"
        : value >= 50
          ? "w-1/2"
          : value >= 25
            ? "w-1/4"
            : "w-1/12";

  return (
    <div className="h-2 overflow-hidden rounded-sm bg-surface-2">
      <div className={`h-full rounded-sm bg-gold ${widthClass}`} />
    </div>
  );
}
