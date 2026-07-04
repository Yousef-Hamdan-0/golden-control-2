"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { useFinanceSummaryQuery } from "@/features/expenses/hooks/use-expenses";
import { Icon, type IconName } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";
import { SectionTitle } from "../shared/SectionTitle";

const MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
] as const;

type MetricTone = "gold" | "success" | "info" | "danger" | "neutral";

interface DateParts {
  day: string;
  month: string;
  year: string;
}

interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
  icon: IconName;
  tone: MetricTone;
  series: number[];
}

const TONE_STYLES: Record<
  MetricTone,
  { icon: string; stroke: string; fill: string; accent: string }
> = {
  gold: {
    icon: "bg-gold-soft text-gold",
    stroke: "var(--gold)",
    fill: "rgba(176, 141, 60, 0.14)",
    accent: "bg-gold",
  },
  success: {
    icon: "bg-success-soft text-success",
    stroke: "var(--success)",
    fill: "var(--success-soft)",
    accent: "bg-success",
  },
  info: {
    icon: "bg-info-soft text-info",
    stroke: "var(--info)",
    fill: "var(--info-soft)",
    accent: "bg-info",
  },
  danger: {
    icon: "bg-danger-soft text-danger",
    stroke: "var(--danger)",
    fill: "var(--danger-soft)",
    accent: "bg-danger",
  },
  neutral: {
    icon: "bg-surface-2 text-content-muted",
    stroke: "var(--text-muted)",
    fill: "var(--surface-2)",
    accent: "bg-content-muted",
  },
};

function isoDate(year: string, month: string, day: string) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateRangeFromFilters(filters: DateParts) {
  if (filters.day && filters.month && filters.year) {
    const date = isoDate(filters.year, filters.month, filters.day);
    return { startDate: date, endDate: date };
  }

  return { startDate: "2000-01-01", endDate: todayKey() };
}

function seriesForValue(value: number) {
  return [0, Math.max(0, value)];
}

function Sparkline({ series, tone }: { series: number[]; tone: MetricTone }) {
  const style = TONE_STYLES[tone];
  const width = 280;
  const height = 72;
  const maximum = Math.max(...series, 1);
  const points = series.map((value, index) => {
    const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
    const y = height - 8 - (value / maximum) * (height - 20);
    return `${x},${y}`;
  });
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[72px] w-full overflow-visible"
      preserveAspectRatio="none"
      role="img"
      aria-label="رسم بياني مصغر لحركة المؤشر"
    >
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="var(--border)" />
      <polygon points={areaPoints} fill={style.fill} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={style.stroke}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => {
        const [cx, cy] = point.split(",");
        return (
          <circle
            key={`${point}-${index}`}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="var(--surface)"
            stroke={style.stroke}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function MetricCard({ label, value, helper, icon, tone, series }: MetricCardProps) {
  const style = TONE_STYLES[tone];

  return (
    <Card className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("absolute inset-y-0 right-0 w-1", style.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-muted">{label}</p>
          <p className="mt-2 font-heading text-2xl font-bold leading-tight text-content xl:text-[1.65rem]">
            {formatMoney(value, "SYP")}
          </p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", style.icon)}>
          <Icon name={icon} size={21} />
        </span>
      </div>
      <div className="mt-5" dir="ltr">
        <Sparkline series={series} tone={tone} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-content-muted">
        <span>{helper}</span>
        <span>الحركة خلال الفترة</span>
      </div>
    </Card>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-content-muted">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-md border border-border bg-surface-2 px-3 pl-9 text-sm text-content outline-none transition focus:border-primary focus:bg-surface focus:ring-[3px] focus:ring-gold/15"
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
        />
      </span>
    </label>
  );
}

export function SalesProfitsScreen() {
  const toast = useToast();
  const [filters, setFilters] = useState<DateParts>({ day: "", month: "", year: "" });
  const summaryParams = useMemo(() => dateRangeFromFilters(filters), [filters]);
  const summaryQuery = useFinanceSummaryQuery(summaryParams);

  useEffect(() => {
    if (summaryQuery.isError && summaryQuery.error) {
      toast.error("تعذر تحميل الملخص المالي", getApiErrorMessage(summaryQuery.error));
    }
  }, [summaryQuery.error, summaryQuery.isError, toast]);

  const years = useMemo(
    () => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 6 }, (_, index) => String(currentYear - index));
    },
    [],
  );
  const hasSpecificDate = Boolean(filters.day && filters.month && filters.year);

  const dashboard = useMemo(() => {
    const summary = summaryQuery.data;
    const expenses = (summary?.fixedCosts ?? 0) + (summary?.variableCosts ?? 0);
    const sales = summary?.totalRevenues ?? 0;
    const parts = summary?.partsCosts ?? 0;
    const netProfit = summary?.netProfit ?? 0;
    return {
      totals: { sales, paid: sales, remaining: 0, expenses, parts, netProfit },
      series: {
        sales: seriesForValue(sales),
        paid: seriesForValue(sales),
        remaining: seriesForValue(0),
        expenses: seriesForValue(expenses),
        parts: seriesForValue(parts),
        netProfit: seriesForValue(netProfit),
      },
    };
  }, [summaryQuery.data]);

  const hasFilterSelection = Boolean(filters.day || filters.month || filters.year);
  const filterDescription = hasSpecificDate
    ? `${filters.day} / ${MONTHS[Number(filters.month) - 1]} / ${filters.year}`
    : hasFilterSelection
      ? "أكمل اختيار اليوم والشهر والسنة"
      : "عرض كل البيانات";

  const metrics: MetricCardProps[] = [
    {
      label: "إجمالي المبيعات",
      value: dashboard.totals.sales,
      helper: "من ملخص الإيرادات في API",
      icon: "chart",
      tone: "gold",
      series: dashboard.series.sales,
    },
    {
      label: "إجمالي المبالغ المدفوعة",
      value: dashboard.totals.paid,
      helper: "Revenue محسوبة من الدفعات",
      icon: "wallet",
      tone: "success",
      series: dashboard.series.paid,
    },
    {
      label: "إجمالي المبالغ المتبقية",
      value: dashboard.totals.remaining,
      helper: "غير متوفر من API الحالي",
      icon: "clock",
      tone: "info",
      series: dashboard.series.remaining,
    },
    {
      label: "إجمالي المصروفات",
      value: dashboard.totals.expenses,
      helper: "ثابتة ومتغيرة من API",
      icon: "file",
      tone: "danger",
      series: dashboard.series.expenses,
    },
    {
      label: "إجمالي سعر القطع المستهلكة",
      value: dashboard.totals.parts,
      helper: "Parts costs من API",
      icon: "box",
      tone: "neutral",
      series: dashboard.series.parts,
    },
    {
      label: "صافي الربح",
      value: dashboard.totals.netProfit,
      helper: "من الملخص المالي",
      icon: "shield",
      tone: dashboard.totals.netProfit >= 0 ? "success" : "danger",
      series: dashboard.series.netProfit,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="المبيعات والأرباح"
        subtitle="رؤية مالية موحّدة للمبيعات، التحصيلات، التكاليف، وصافي الربح."
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold">
              <Icon name="calendar" size={20} />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-content">تاريخ التقرير</h2>
              <p className="mt-1 text-xs leading-5 text-content-muted">
                اختر اليوم والشهر والسنة معًا لعرض بيانات يوم واحد محدد.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[130px_170px_130px_auto]">
            <SelectFilter
              label="اليوم"
              value={filters.day}
              onChange={(day) => setFilters((current) => ({ ...current, day }))}
            >
              <option value="">اختر اليوم</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </SelectFilter>
            <SelectFilter
              label="الشهر"
              value={filters.month}
              onChange={(month) => setFilters((current) => ({ ...current, month }))}
            >
              <option value="">اختر الشهر</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </SelectFilter>
            <SelectFilter
              label="السنة"
              value={filters.year}
              onChange={(year) => setFilters((current) => ({ ...current, year }))}
            >
              <option value="">اختر السنة</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </SelectFilter>
            <button
              type="button"
              disabled={!hasFilterSelection}
              onClick={() => setFilters({ day: "", month: "", year: "" })}
              className="h-11 self-end rounded-md border border-border bg-surface px-4 text-sm font-medium text-content transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              عرض الكل
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-content-muted">
          <span>العرض الحالي: <strong className="font-semibold text-content">{filterDescription}</strong></span>
          <span>{summaryQuery.isLoading ? "جاري تحميل الملخص..." : "البيانات من API المالية"}</span>
        </div>
      </Card>

      <section aria-labelledby="financial-metrics-title">
        <h2 id="financial-metrics-title" className="sr-only">المؤشرات المالية</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>
    </div>
  );
}
