import { cn } from "@/lib/utils/cn";

interface Props {
  title: string;
  subtitle?: string;
  align?: "start" | "end";
}

/** Content-area page title (the gold heading shown inside each screen). */
export function PageHeader({ title, subtitle, align = "end" }: Props) {
  return (
    <div className={cn(align === "end" ? "text-right" : "text-left")}>
      <h2 className="font-heading text-xl font-bold text-gold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-content-muted">{subtitle}</p>}
    </div>
  );
}
