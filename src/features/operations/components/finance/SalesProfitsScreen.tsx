"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import {
  useFinanceDailySummaryQuery,
  useFinanceSummaryQuery,
} from "@/features/expenses/hooks/use-expenses";
import { useInvoicesAllQuery } from "@/features/invoices/hooks/use-invoices";
import { useDollarExchangeRate } from "@/features/settings/hooks/use-settings";
import { remaining } from "@/features/operations/utils/invoice";
import { Icon, type IconName } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { todayDateKey } from "@/lib/format/date";
import { monthLabel, SYRIAC_MONTHS } from "@/lib/format/months";
import { cn } from "@/lib/utils/cn";
import { SectionTitle } from "../shared/SectionTitle";

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
  format?: "money" | "count";
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

/** Invoices are filtered by an arbitrary date range (their own real API
 * contract), so "last 3 months" here is a genuine rolling day-based window. */
function lastThreeMonthsRange() {
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  start.setDate(start.getDate() + 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: todayKey() };
}

/** The financial report API (GET /api/reports/financial) instead accepts a
 * single year plus up to 3 month numbers within that year — not an arbitrary
 * date range — so this rolling window is clamped to whichever months of the
 * current year fall within the last 3. */
function lastThreeMonthsInYear() {
  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const months = [currentMonth - 2, currentMonth - 1, currentMonth].filter((month) => month >= 1);
  return { year, months };
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

function MetricCard({ label, value, helper, icon, tone, series, format = "money" }: MetricCardProps) {
  const style = TONE_STYLES[tone];

  return (
    <Card className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("absolute inset-y-0 right-0 w-1", style.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-muted">{label}</p>
          <p className="mt-2 font-heading text-2xl font-bold leading-tight text-content xl:text-[1.65rem]">
            {format === "count" ? value.toLocaleString("en-US") : formatMoney(value, "SYP")}
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

/** Defaults the date filter to today (app-wide Asia/Damascus "today"), so the
 * page loads with the current day's data already fetched with no user input. */
function todayDateParts(): DateParts {
  const [year, month, day] = todayDateKey().split("-");
  return { day: String(Number(day)), month: String(Number(month)), year };
}

export function SalesProfitsScreen() {
  const toast = useToast();
  const [filters, setFilters] = useState<DateParts>(todayDateParts);
  const hasSpecificDate = Boolean(filters.day && filters.month && filters.year);
  // A full day/month/year selection uses the daily summary API
  // (GET /api/finance/summary?date=...); otherwise the range summary loads.
  const selectedDate = hasSpecificDate
    ? isoDate(filters.year, filters.month, filters.day)
    : "";
  // Invoices (their own date-range API) and the financial summary (year +
  // month-numbers API) need the same "last 3 months" window in two different
  // shapes, so each gets its own params derived from the same filter state.
  const invoiceRangeParams = useMemo(
    () => (hasSpecificDate ? { startDate: "", endDate: "" } : lastThreeMonthsRange()),
    [hasSpecificDate],
  );
  const summaryParams = useMemo(
    () => (hasSpecificDate ? { year: 0, months: [] } : lastThreeMonthsInYear()),
    [hasSpecificDate],
  );
  const summaryQuery = useFinanceSummaryQuery(summaryParams);
  const dailySummaryQuery = useFinanceDailySummaryQuery(selectedDate);
  const dailySummary = hasSpecificDate ? dailySummaryQuery.data : undefined;
  const dollarExchangeRate = useDollarExchangeRate();
  // Range mode has no single API field for "paid"/"remaining"/invoice count
  // over a period, so they are aggregated for real from the invoices that
  // fall within the same period (same date range as the financial summary).
  const rangeInvoicesQuery = useInvoicesAllQuery(invoiceRangeParams, !hasSpecificDate);

  useEffect(() => {
    if (summaryQuery.isError && summaryQuery.error) {
      toast.error("تعذر تحميل الملخص المالي", getApiErrorMessage(summaryQuery.error));
    }
  }, [summaryQuery.error, summaryQuery.isError, toast]);

  useEffect(() => {
    if (dailySummaryQuery.isError && dailySummaryQuery.error) {
      toast.error(
        "تعذر تحميل الملخص المالي اليومي",
        getApiErrorMessage(dailySummaryQuery.error),
      );
    }
  }, [dailySummaryQuery.error, dailySummaryQuery.isError, toast]);

  useEffect(() => {
    if (rangeInvoicesQuery.isError && rangeInvoicesQuery.error) {
      toast.error("تعذر تحميل بيانات الفواتير", getApiErrorMessage(rangeInvoicesQuery.error));
    }
  }, [rangeInvoicesQuery.error, rangeInvoicesQuery.isError, toast]);

  const years = useMemo(
    () => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 6 }, (_, index) => String(currentYear - index));
    },
    [],
  );

  const dashboard = useMemo(() => {
    const summary = summaryQuery.data;
    const sales = summary?.totalRevenues ?? 0;
    const parts = summary?.partsCosts ?? 0;
    const netProfit = summary?.netProfit ?? 0;
    // Aggregate real paid/remaining/invoice-count from the period's invoices,
    // converting USD invoices to SYP with the live exchange rate so mixed
    // currencies sum correctly (same conversion approach used across invoices).
    const rangeInvoices = rangeInvoicesQuery.data ?? [];
    let paidSyp = 0;
    let totalSyp = 0;
    for (const invoice of rangeInvoices) {
      const factor = invoice.currency === "USD" ? dollarExchangeRate : 1;
      paidSyp += invoice.paid * factor;
      totalSyp += invoice.total * factor;
    }
    const invoiceCount = rangeInvoices.length;
    const remainingSyp = remaining(totalSyp, paidSyp);

    return {
      totals: { sales, paid: paidSyp, remaining: remainingSyp, invoiceCount, parts, netProfit },
      series: {
        sales: seriesForValue(sales),
        paid: seriesForValue(paidSyp),
        remaining: seriesForValue(remainingSyp),
        invoiceCount: seriesForValue(invoiceCount),
        parts: seriesForValue(parts),
        netProfit: seriesForValue(netProfit),
      },
    };
  }, [summaryQuery.data, rangeInvoicesQuery.data, dollarExchangeRate]);

  const hasFilterSelection = Boolean(filters.day || filters.month || filters.year);
  const filterDescription = hasSpecificDate
    ? `${filters.day} / ${monthLabel(Number(filters.month))} / ${filters.year}`
    : hasFilterSelection
      ? "أكمل اختيار اليوم والشهر والسنة"
      : "عرض كل البيانات";

  // Daily mode (specific date selected): the six fields of GET /api/finance/summary.
  const dailyMetrics: MetricCardProps[] = [
    {
      label: "إجمالي المبيعات",
      value: dailySummary?.totalSales ?? 0,
      helper: "مبيعات فواتير اليوم المحدد",
      icon: "chart",
      tone: "gold",
      series: seriesForValue(dailySummary?.totalSales ?? 0),
    },
    {
      label: "إجمالي المبالغ المدفوعة",
      value: dailySummary?.totalPaid ?? 0,
      helper: "المدفوع على فواتير اليوم",
      icon: "wallet",
      tone: "success",
      series: seriesForValue(dailySummary?.totalPaid ?? 0),
    },
    {
      label: "إجمالي المبالغ المتبقية",
      value: dailySummary?.totalRemaining ?? 0,
      helper: "المتبقي على فواتير اليوم",
      icon: "clock",
      tone: "info",
      series: seriesForValue(dailySummary?.totalRemaining ?? 0),
    },
    {
      label: "إجمالي تكلفة القطع",
      value: dailySummary?.totalPartsCost ?? 0,
      helper: "تكلفة القطع لفواتير اليوم",
      icon: "box",
      tone: "neutral",
      series: seriesForValue(dailySummary?.totalPartsCost ?? 0),
    },
    {
      label: "صافي الربح",
      value: dailySummary?.netProfit ?? 0,
      helper: "صافي ربح اليوم المحدد",
      icon: "shield",
      tone: (dailySummary?.netProfit ?? 0) >= 0 ? "success" : "danger",
      series: seriesForValue(dailySummary?.netProfit ?? 0),
    },
    {
      label: "عدد الفواتير",
      value: dailySummary?.invoiceCount ?? 0,
      helper: "فواتير اليوم المحدد",
      icon: "file",
      tone: "gold",
      series: seriesForValue(dailySummary?.invoiceCount ?? 0),
      format: "count",
    },
  ];

  const rangeMetrics: MetricCardProps[] = [
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
      helper: "من فواتير الفترة (API)",
      icon: "wallet",
      tone: "success",
      series: dashboard.series.paid,
    },
    {
      label: "إجمالي المبالغ المتبقية",
      value: dashboard.totals.remaining,
      helper: "من فواتير الفترة (API)",
      icon: "clock",
      tone: "info",
      series: dashboard.series.remaining,
    },
    {
      label: "عدد الفواتير",
      value: dashboard.totals.invoiceCount,
      helper: "من فواتير الفترة (API)",
      icon: "file",
      tone: "gold",
      series: dashboard.series.invoiceCount,
      format: "count",
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

  const metrics = hasSpecificDate ? dailyMetrics : rangeMetrics;

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

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[130px_170px_130px]">
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
              {SYRIAC_MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{monthLabel(index + 1)}</option>
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
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs text-content-muted">
          <span>العرض الحالي: <strong className="font-semibold text-content">{filterDescription}</strong></span>
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
