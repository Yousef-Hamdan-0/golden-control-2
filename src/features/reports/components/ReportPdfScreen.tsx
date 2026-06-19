"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export type ReportType =
  | "orders"
  | "technicians"
  | "inventory-movements"
  | "financial";

interface ReportDefinition {
  title: string;
  subtitle: string;
  fileName: string;
}

const REPORT_DEFINITIONS: Record<ReportType, ReportDefinition> = {
  orders: {
    title: "تقرير الطلبات",
    subtitle: "تقرير PDF لطلبات الصيانة وحالاتها خلال الفترة المختارة.",
    fileName: "orders-report.pdf",
  },
  technicians: {
    title: "تقارير الفنيين",
    subtitle: "تقرير PDF لأداء الفنيين والطلبات والإيرادات المرتبطة بهم.",
    fileName: "technicians-report.pdf",
  },
  "inventory-movements": {
    title: "تقارير حركة المخزون",
    subtitle: "تقرير PDF لحركات التوريد والصرف والتسويات في المخزون.",
    fileName: "inventory-movements-report.pdf",
  },
  financial: {
    title: "التقارير المالية",
    subtitle: "تقرير PDF للمبيعات والمصروفات والتحصيلات وصافي الربح.",
    fileName: "financial-report.pdf",
  },
};

const REPORTS_API_BASE =
  process.env.NEXT_PUBLIC_REPORTS_API_BASE_URL?.replace(/\/$/, "") ?? "/api/reports";

export const REPORT_TYPES = Object.keys(REPORT_DEFINITIONS) as ReportType[];

export function ReportPdfScreen({ type }: { type: ReportType }) {
  const report = REPORT_DEFINITIONS[type];
  const [filterMode, setFilterMode] = useState<"all" | "range">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  async function loadReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (filterMode === "range" && (!from || !to)) {
      setError("يرجى اختيار تاريخ البداية وتاريخ النهاية.");
      return;
    }

    if (filterMode === "range" && from > to) {
      setError("يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساويًا له.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const search = new URLSearchParams(
        filterMode === "all" ? { scope: "all" } : { from, to },
      );
      const response = await fetch(`${REPORTS_API_BASE}/${type}?${search.toString()}`, {
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        throw new Error("تعذر جلب التقرير من الخادم.");
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/pdf")) {
        throw new Error("استجابة الخادم ليست ملف PDF صالحًا.");
      }

      const blob = await response.blob();
      const nextPdfUrl = URL.createObjectURL(blob);
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextPdfUrl;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "حدث خطأ غير متوقع أثناء تحميل التقرير.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title={report.title} subtitle={report.subtitle} />

      <Card className="p-4 sm:p-5">
        <form className="space-y-5" onSubmit={loadReport}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-content">فترة التقرير</h2>
              <p className="mt-1 text-xs text-content-muted">
                اعرض كل البيانات أو حدد تاريخ البداية والنهاية للفترة المطلوبة.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={filterMode === "all"}
                onClick={() => {
                  setFilterMode("all");
                  setError("");
                }}
                className={cn(
                  "h-11 min-w-32 rounded-md border px-4 text-sm font-medium transition",
                  filterMode === "all"
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-border bg-surface text-content-muted hover:border-gold",
                )}
              >
                عرض الكل
              </button>
              <button
                type="button"
                aria-pressed={filterMode === "range"}
                onClick={() => {
                  setFilterMode("range");
                  setError("");
                }}
                className={cn(
                  "h-11 min-w-32 rounded-md border px-4 text-sm font-medium transition",
                  filterMode === "range"
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-border bg-surface text-content-muted hover:border-gold",
                )}
              >
                فترة زمنية
              </button>
            </div>
          </div>

          {filterMode === "range" ? (
            <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <Field label="من تاريخ" htmlFor={`${type}-report-from`}>
                <Input
                  id={`${type}-report-from`}
                  type="date"
                  dir="ltr"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>
              <Field label="إلى تاريخ" htmlFor={`${type}-report-to`}>
                <Input
                  id={`${type}-report-to`}
                  type="date"
                  dir="ltr"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Icon name={loading ? "clock" : "file"} size={18} />
              {loading ? "جارٍ تحميل التقرير..." : "عرض تقرير PDF"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Icon name="file" size={18} className="text-gold" />
            <h2 className="font-heading text-sm font-bold text-content">معاينة التقرير</h2>
          </div>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              download={report.fileName}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gold px-4 text-sm font-medium text-gold transition hover:bg-gold-soft"
            >
              تنزيل PDF
            </a>
          ) : null}
        </div>

        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={`معاينة ${report.title}`}
            className="h-[70vh] min-h-[520px] w-full bg-surface"
          />
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-gold-soft text-gold">
              <Icon name="file" size={26} />
            </span>
            <div>
              <p className="font-heading font-bold text-content">لم يتم تحميل تقرير بعد</p>
              <p className="mt-1 text-sm text-content-muted">
                اختر نطاق البيانات ثم اضغط «عرض تقرير PDF» لاستلامه من الـ API.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
