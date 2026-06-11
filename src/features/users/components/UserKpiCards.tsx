"use client";

import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/lib/icons";
import { useUserCountsQuery } from "@/features/users/hooks/use-users-query";
import { cn } from "@/lib/utils/cn";

interface Stat {
  label: string;
  value?: number;
  icon: IconName;
  tint: string;
}

export function UserKpiCards() {
  const { data, isLoading } = useUserCountsQuery();

  const stats: Stat[] = [
    {
      label: "فنيون معتمدون",
      value: data?.certifiedTechnicians,
      icon: "wrench",
      tint: "bg-info-soft text-info",
    },
    {
      label: "موظفين",
      value: data?.employees,
      icon: "users",
      tint: "bg-success-soft text-success",
    },
    {
      label: "إجمالي المستخدمين",
      value: data?.total,
      icon: "users",
      tint: "bg-gold-soft text-gold",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="flex items-center justify-between gap-3 p-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-md", s.tint)}>
            <Icon name={s.icon} />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-content">
              {isLoading ? "—" : s.value}
            </div>
            <div className="text-xs text-content-muted">{s.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
