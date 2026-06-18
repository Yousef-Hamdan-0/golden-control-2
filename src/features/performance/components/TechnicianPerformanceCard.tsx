import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format/currency";
import { Icon } from "@/lib/icons";
import {
  summarizeOrders,
  type PerformanceOrderStatus,
  type TechnicianDailyPerformance,
} from "@/features/performance/models/performance.model";

interface TechnicianPerformanceCardProps {
  technician: TechnicianDailyPerformance;
}

const STATUS_DETAILS: Record<
  PerformanceOrderStatus,
  { label: string; tone: BadgeTone }
> = {
  completed: { label: "مكتمل", tone: "success" },
  incomplete: { label: "غير مكتمل", tone: "danger" },
  returned: { label: "مسحوبة إلى المركز", tone: "info" },
  active: { label: "نشط", tone: "gold" },
};

function formatHours(hours: number | null) {
  return hours === null ? "—" : `${hours} ساعة`;
}

export function TechnicianPerformanceCard({
  technician,
}: TechnicianPerformanceCardProps) {
  const summary = summarizeOrders(technician.orders);
  const breakdown = [
    { label: "مكتملة", value: summary.completedOrders, className: "text-success" },
    { label: "غير مكتملة", value: summary.incompleteOrders, className: "text-danger" },
    { label: "نشطة", value: summary.activeOrders, className: "text-gold" },
    { label: "مسحوبة إلى المركز", value: summary.returnedOrders, className: "text-info" },
  ] as const;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold">
            <Icon name="wrench" size={21} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-lg font-bold text-content">
              {technician.name}
            </h3>
            <p className="text-xs text-content-muted" dir="ltr">
              {technician.id}
            </p>
          </div>
        </div>
        <Badge tone="gold">إجمالي الطلبات: {summary.totalOrders}</Badge>
      </CardHeader>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {breakdown.map((item, index) => {
            const dividerClass =
              index === 0
                ? "border-b border-l lg:border-b-0"
                : index === 1
                  ? "border-b lg:border-b-0 lg:border-l"
                  : index === 2
                    ? "border-l"
                    : "";

            return (
              <div
                key={item.label}
                className={`border-border p-3 text-center ${dividerClass}`}
              >
                <p className="text-xs text-content-muted">{item.label}</p>
                <p className={`mt-1 font-heading text-xl font-bold ${item.className}`}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-y border-border">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
          <Icon name="clock" size={17} className="text-gold" />
          <h4 className="text-sm font-semibold text-content">تفاصيل الخط الزمني للطلبات</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {[
                  "رقم الطلب",
                  "الحالة",
                  "ساعات الصيانة",
                  "ساعات الإنجاز",
                  "وقت البدء",
                  "وقت الانتهاء",
                ].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {technician.orders.map((order) => {
                const status = STATUS_DETAILS[order.status];

                return (
                  <tr key={order.id} className="border-t border-border hover:bg-gold-soft">
                    <td className="px-4 py-3 font-bold text-gold" dir="ltr">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatHours(order.maintenanceHours)}
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {formatHours(order.completionHours)}
                    </td>
                    <td className="px-4 py-3 text-content-muted" dir="ltr">
                      {order.startTime}
                    </td>
                    <td className="px-4 py-3 text-content-muted" dir="ltr">
                      {order.endTime ?? "مستمر"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-xs text-content-muted">إجمالي الإيرادات بالليرة السورية</p>
          <p className="mt-1 font-heading text-xl font-bold text-content">
            {formatMoney(summary.revenueSyp, "SYP")}
          </p>
        </div>
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-xs text-content-muted">إجمالي الإيرادات بالدولار</p>
          <p className="mt-1 font-heading text-xl font-bold text-content">
            {formatMoney(summary.revenueUsd, "USD")}
          </p>
        </div>
      </div>
    </Card>
  );
}
