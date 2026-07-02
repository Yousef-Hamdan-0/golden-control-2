"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { useDashboardTechnicianPerformanceQuery } from "@/features/dashboard/hooks/use-dashboard";
import { formatMoney } from "@/lib/format/currency";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { ProgressBar } from "../shared/ProgressBar";

export function TechnicianPerformanceScreen() {
  const performanceQuery = useDashboardTechnicianPerformanceQuery();
  const performance = performanceQuery.data;
  const technicians = performance?.technicians ?? [];
  const overall = performance?.overall;
  const technicianSummaries = technicians.map((tech) => {
    const delayed = tech.incompletedCount + tech.pulltocenterCount;
    const total = tech.completedCount + tech.activeCount + delayed;
    const satisfaction =
      total > 0 ? Math.round((tech.completedCount / total) * 100) : 0;

    return {
      id: tech.technicianId,
      name: tech.technicianName || "فني غير محدد",
      userNumber: tech.userNumber,
      completed: tech.completedCount,
      active: tech.activeCount,
      delayed,
      revenue: tech.sales || tech.paymentsSyp,
      satisfaction,
      status: tech.activeCount > 0 ? "busy" : "available",
    };
  });
  const averageSatisfaction = technicianSummaries.length
    ? Math.round(
        technicianSummaries.reduce((sum, tech) => sum + tech.satisfaction, 0) /
          technicianSummaries.length,
      )
    : 0;
  const totalRevenue =
    technicianSummaries.reduce((sum, tech) => sum + tech.revenue, 0) ||
    overall?.paymentsSypToday ||
    0;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="أداء الفنيين"
        subtitle="تتبع الإنجاز، الطلبات النشطة، التأخير، رضا العملاء، والعائد لكل فني."
      />

      {performanceQuery.isError ? (
        <Card className="border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {getApiErrorMessage(performanceQuery.error)}
        </Card>
      ) : null}

      <KpiCards
        cards={[
          {
            label: "الطلبات المكتملة",
            value: performanceQuery.isLoading ? "..." : String(overall?.completedToday ?? 0),
            icon: "shield",
            tone: "success",
          },
          {
            label: "طلبات نشطة",
            value: performanceQuery.isLoading ? "..." : String(overall?.activeToday ?? 0),
            icon: "clipboard",
            tone: "info",
          },
          {
            label: "متوسط الرضا",
            value: performanceQuery.isLoading ? "..." : `${averageSatisfaction}%`,
            icon: "chart",
          },
          {
            label: "العائد",
            value: performanceQuery.isLoading ? "..." : formatMoney(totalRevenue),
            icon: "wallet",
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {technicianSummaries.map((tech) => (
          <Card key={tech.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="text-right">
                <h3 className="font-heading text-lg font-bold text-content">
                  {tech.name}
                </h3>
                <p className="text-sm text-content-muted">
                  {tech.userNumber || tech.id}
                </p>
              </div>
              <Badge tone={tech.status === "available" ? "success" : "gold"} dot>
                {tech.status === "available" ? "متاح" : "مشغول"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">مكتملة</p>
                <p className="font-heading text-xl font-bold text-content">
                  {tech.completed}
                </p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">نشطة</p>
                <p className="font-heading text-xl font-bold text-content">
                  {tech.active}
                </p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <p className="text-xs text-content-muted">تأخير</p>
                <p className="font-heading text-xl font-bold text-content">
                  {tech.delayed}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-content-muted">
                <span>رضا العملاء</span>
                <span>{tech.satisfaction}%</span>
              </div>
              <ProgressBar value={tech.satisfaction} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
