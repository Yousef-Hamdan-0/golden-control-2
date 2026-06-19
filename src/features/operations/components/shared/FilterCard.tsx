import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function FilterCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={`grid gap-3 p-4 md:grid-cols-4 ${className}`}>{children}</Card>;
}
