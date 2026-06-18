import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/lib/icons";
import { PerformanceKpiCards } from "@/features/performance/components/PerformanceKpiCards";
import { TechnicianPerformanceCard } from "@/features/performance/components/TechnicianPerformanceCard";
import {
  DAILY_TECHNICIAN_PERFORMANCE,
  PERFORMANCE_REPORT_DATE,
} from "@/features/performance/data/performance.mock";
import { summarizeTechnicians } from "@/features/performance/models/performance.model";

const PERFORMANCE_SUMMARY = summarizeTechnicians(DAILY_TECHNICIAN_PERFORMANCE);

function formatReportDate(date: string) {
  return new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Damascus",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function DailyPerformanceScreen() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="لوحة الأداء اليومي"
          subtitle="متابعة إنجاز الطلبات، أوقات الصيانة، والإيرادات اليومية لكل فني."
        />
        <Badge tone="neutral" className="gap-2 px-3 py-2">
          <Icon name="calendar" size={16} className="text-gold" />
          {formatReportDate(PERFORMANCE_REPORT_DATE)}
        </Badge>
      </div>

      <PerformanceKpiCards summary={PERFORMANCE_SUMMARY} />

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
            {DAILY_TECHNICIAN_PERFORMANCE.length} فنيين
          </span>
        </div>

        <div className="space-y-4">
          {DAILY_TECHNICIAN_PERFORMANCE.map((technician) => (
            <TechnicianPerformanceCard key={technician.id} technician={technician} />
          ))}
        </div>
      </section>
    </div>
  );
}
