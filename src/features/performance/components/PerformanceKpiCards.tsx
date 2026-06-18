import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format/currency";
import { Icon, type IconName } from "@/lib/icons";
import type { PerformanceSummary } from "@/features/performance/models/performance.model";

interface PerformanceKpiCardsProps {
  summary: PerformanceSummary;
}

interface KpiDefinition {
  label: string;
  value: string;
  icon: IconName;
  iconClassName: string;
}

export function PerformanceKpiCards({ summary }: PerformanceKpiCardsProps) {
  const cards: readonly KpiDefinition[] = [
    {
      label: "الطلبات المكتملة",
      value: String(summary.completedOrders),
      icon: "shield",
      iconClassName: "bg-success-soft text-success",
    },
    {
      label: "الطلبات غير المكتملة",
      value: String(summary.incompleteOrders),
      icon: "alert",
      iconClassName: "bg-danger-soft text-danger",
    },
    {
      label: "المعادة إلى المركز",
      value: String(summary.returnedOrders),
      icon: "home",
      iconClassName: "bg-info-soft text-info",
    },
    {
      label: "الطلبات النشطة",
      value: String(summary.activeOrders),
      icon: "clipboard",
      iconClassName: "bg-gold-soft text-gold",
    },
    {
      label: "الإيرادات بالدولار",
      value: formatMoney(summary.revenueUsd, "USD"),
      icon: "wallet",
      iconClassName: "bg-info-soft text-info",
    },
    {
      label: "الإيرادات بالليرة",
      value: formatMoney(summary.revenueSyp, "SYP"),
      icon: "wallet",
      iconClassName: "bg-gold-soft text-gold",
    },
  ];

  return (
    <section aria-labelledby="performance-summary-title">
      <h3 id="performance-summary-title" className="sr-only">
        ملخص الأداء اليومي
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label} className="flex min-h-32 flex-col justify-between gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${card.iconClassName}`}>
              <Icon name={card.icon} size={20} />
            </div>
            <div>
              <p className="text-xs leading-5 text-content-muted">{card.label}</p>
              <p className="mt-1 break-words font-heading text-xl font-bold text-content">
                {card.value}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
