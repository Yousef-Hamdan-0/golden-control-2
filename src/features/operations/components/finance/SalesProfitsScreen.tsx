"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { localDateKey } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";
import {
  EXPENSES_STORAGE_KEY,
  INITIAL_EXPENSES,
} from "@/features/expenses/data/expenses.mock";
import type { ExpenseRecord } from "@/features/expenses/models/expense.model";
import {
  INVENTORY_ITEMS_STORAGE_KEY,
  INVOICES_STORAGE_KEY,
  USD_TO_SYP_RATE,
} from "../../constants";
import { INVENTORY, INVOICES } from "../../data/seed";
import type { InventoryItem, Invoice } from "../../types";
import { readStoredInvoices, readStoredList } from "../../utils/storage";
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

function toSyp(value: number, currency: "SYP" | "USD") {
  return currency === "USD" ? value * USD_TO_SYP_RATE : value;
}

function matchesDate(date: string, filters: DateParts) {
  const [year, month, day] = localDateKey(date).split("-");
  return (
    (!filters.year || filters.year === year) &&
    (!filters.month || filters.month === String(Number(month))) &&
    (!filters.day || filters.day === String(Number(day)))
  );
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
  const [filters, setFilters] = useState<DateParts>({ day: "", month: "", year: "" });
  const [invoices, setInvoices] = useState<Invoice[]>(readStoredInvoices);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() =>
    readStoredList(INVENTORY_ITEMS_STORAGE_KEY, INVENTORY),
  );
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    readStoredList(EXPENSES_STORAGE_KEY, [...INITIAL_EXPENSES]),
  );

  useEffect(() => {
    const syncData = (event?: Event) => {
      const key =
        event instanceof StorageEvent
          ? event.key
          : event instanceof CustomEvent
            ? event.detail?.key
            : null;

      if (!key || key === INVOICES_STORAGE_KEY) {
        setInvoices(readStoredInvoices());
      }
      if (!key || key === INVENTORY_ITEMS_STORAGE_KEY) {
        setInventoryItems(readStoredList(INVENTORY_ITEMS_STORAGE_KEY, INVENTORY));
      }
      if (!key || key === EXPENSES_STORAGE_KEY) {
        setExpenses(readStoredList(EXPENSES_STORAGE_KEY, [...INITIAL_EXPENSES]));
      }
    };

    window.addEventListener("storage", syncData);
    window.addEventListener("golden-control:data-updated", syncData);
    window.addEventListener("focus", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("golden-control:data-updated", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, []);

  const years = useMemo(
    () =>
      Array.from(
        new Set([
          ...invoices.map((invoice) => localDateKey(invoice.issuedAt).slice(0, 4)),
          ...expenses.map((expense) => expense.month.slice(0, 4)),
        ]),
      ).sort((a, b) => Number(b) - Number(a)),
    [expenses, invoices],
  );
  const hasSpecificDate = Boolean(filters.day && filters.month && filters.year);

  const dashboard = useMemo(() => {
    const activeFilters =
      filters.day && filters.month && filters.year
        ? filters
        : { day: "", month: "", year: "" };
    const filteredInvoices = invoices.filter((invoice) =>
      matchesDate(invoice.issuedAt, activeFilters),
    );
    const expenseRecords = expenses.filter(
      (expense) => matchesDate(`${expense.month}-01`, activeFilters),
    );
    const inventoryCost = new Map(inventoryItems.map((item) => [item.id, item.unitCost]));
    const dateKeys = Array.from(
      new Set([
        ...filteredInvoices.map((invoice) => localDateKey(invoice.issuedAt)),
        ...expenseRecords.map((expense) => `${expense.month}-01`),
      ]),
    ).sort();
    const chartDates = dateKeys.length > 1 ? dateKeys : ["قبل", ...(dateKeys.length ? dateKeys : ["الآن"])];

    const invoiceTotals = (date?: string) => {
      const scoped = date
        ? filteredInvoices.filter((invoice) => localDateKey(invoice.issuedAt) === date)
        : filteredInvoices;
      const sales = scoped.reduce(
        (sum, invoice) => sum + toSyp(invoice.total, invoice.currency),
        0,
      );
      const paid = scoped.reduce(
        (sum, invoice) => sum + toSyp(invoice.paid, invoice.currency),
        0,
      );
      const parts = scoped.reduce(
        (sum, invoice) =>
          sum +
          invoice.parts.reduce(
            (partsSum, part) =>
              part.id.startsWith("PRT-")
                ? partsSum + (inventoryCost.get(part.id) ?? 0) * part.quantity
                : partsSum,
            0,
          ),
        0,
      );
      return { sales, paid, remaining: sales - paid, parts };
    };

    const expenseTotal = (date?: string) =>
      expenseRecords
        .filter((expense) => !date || `${expense.month}-01` === date)
        .reduce((sum, expense) => sum + expense.amount, 0);

    const totals = invoiceTotals();
    const totalExpenses = expenseTotal();
    const netProfit = totals.sales - totalExpenses - totals.parts;
    const seriesFor = (
      pick: (invoice: ReturnType<typeof invoiceTotals>, expenses: number) => number,
    ) =>
      chartDates.map((date) => {
        if (date === "قبل") return 0;
        return Math.max(0, pick(invoiceTotals(date), expenseTotal(date)));
      });

    return {
      invoiceCount: filteredInvoices.length,
      totals: { ...totals, expenses: totalExpenses, netProfit },
      series: {
        sales: seriesFor((invoice) => invoice.sales),
        paid: seriesFor((invoice) => invoice.paid),
        remaining: seriesFor((invoice) => invoice.remaining),
        expenses: seriesFor((_, expense) => expense),
        parts: seriesFor((invoice) => invoice.parts),
        netProfit: seriesFor(
          (invoice, expense) => invoice.sales - expense - invoice.parts,
        ),
      },
    };
  }, [expenses, filters, inventoryItems, invoices]);

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
      helper: `${dashboard.invoiceCount} فواتير ضمن النطاق`,
      icon: "chart",
      tone: "gold",
      series: dashboard.series.sales,
    },
    {
      label: "إجمالي المبالغ المدفوعة",
      value: dashboard.totals.paid,
      helper: "المبالغ المحصلة فعليًا",
      icon: "wallet",
      tone: "success",
      series: dashboard.series.paid,
    },
    {
      label: "إجمالي المبالغ المتبقية",
      value: dashboard.totals.remaining,
      helper: "ذمم وفواتير قيد التحصيل",
      icon: "clock",
      tone: "info",
      series: dashboard.series.remaining,
    },
    {
      label: "إجمالي المصروفات",
      value: dashboard.totals.expenses,
      helper: "المصروفات الثابتة والمتغيرة",
      icon: "file",
      tone: "danger",
      series: dashboard.series.expenses,
    },
    {
      label: "إجمالي سعر القطع المستهلكة",
      value: dashboard.totals.parts,
      helper: "محسوب وفق تكلفة المخزون",
      icon: "box",
      tone: "neutral",
      series: dashboard.series.parts,
    },
    {
      label: "صافي الربح",
      value: dashboard.totals.netProfit,
      helper: "المبيعات ناقص المصروفات والقطع",
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
          <span>{dashboard.invoiceCount} فواتير مطابقة</span>
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
