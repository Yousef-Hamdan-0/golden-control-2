"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useDashboardTechnicianPerformanceQuery } from "@/features/dashboard/hooks/use-dashboard";
import { PerformanceKpiCards } from "@/features/performance/components/PerformanceKpiCards";
import { TechnicianPerformanceCard } from "@/features/performance/components/TechnicianPerformanceCard";
import {
  performanceSummaryFromDashboard,
  techniciansFromDashboardPerformance,
} from "@/features/performance/models/performance.model";
import { getApiErrorMessage } from "@/helpers/api.helper";

export function DailyPerformanceScreen() {
  const performanceQuery = useDashboardTechnicianPerformanceQuery();
  const performance = performanceQuery.data;
  const technicians = techniciansFromDashboardPerformance(performance);
  const summary = performanceSummaryFromDashboard(performance);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="لوحة الأداء اليومي"
        subtitle="متابعة إنجاز الطلبات، أوقات الصيانة، والإيرادات اليومية لكل فني."
      />

      {performanceQuery.isError ? (
        <Card className="border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          {getApiErrorMessage(performanceQuery.error)}
        </Card>
      ) : null}

      <PerformanceKpiCards summary={summary} />

      <section aria-labelledby="technician-performance-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="technician-performance-title"
              className="font-heading text-lg font-bold text-content"
            >
              أداء الفنيين
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              تفاصيل الطلبات المنفذة خلال اليوم حسب الفني المسؤول.
            </p>
          </div>
          <span className="text-sm text-content-muted">
            {performanceQuery.isLoading ? "..." : `${technicians.length} فنيين`}
          </span>
        </div>

        <div className="space-y-7 sm:space-y-8">
          {performanceQuery.isLoading ? (
            <Card className="px-4 py-12 text-center text-content-muted">
              جاري تحميل أداء الفنيين...
            </Card>
          ) : technicians.length ? (
            technicians.map((technician, index) => (
            <div key={technician.id} className="space-y-7 sm:space-y-8">
              {index > 0 && (
                <div aria-hidden="true" className="flex items-center gap-3 px-2">
                  <span className="h-px flex-1 bg-border" />
                  <span className="h-1 w-12 rounded-sm bg-gold/30" />
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <TechnicianPerformanceCard technician={technician} />
            </div>
            ))
          ) : (
            <Card className="px-4 py-12 text-center text-content-muted">
              لا توجد بيانات أداء فنيين من الـ API.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
