"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import { requestAuthenticatedBlob } from "@/helpers/authenticated-api.helper";
import { monthLabel, SYRIAC_MONTHS } from "@/lib/format/months";

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

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index);

/** Inclusive month span, e.g. May→July = 2 (3 consecutive months). */
function monthSpan(startYear: string, startMonth: string, endYear: string, endMonth: string) {
  return (
    (Number(endYear) * 12 + Number(endMonth)) - (Number(startYear) * 12 + Number(startMonth))
  );
}

function lastDayOfMonth(year: string, month: string) {
  return new Date(Number(year), Number(month), 0).getDate();
}

export function ReportPdfScreen({ type }: { type: ReportType }) {
  const report = REPORT_DEFINITIONS[type];
  // The financial report caps the period at 3 consecutive months (API
  // constraint), so it picks a start/end month instead of arbitrary days.
  const isFinancial = type === "financial";
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState(() => String(CURRENT_YEAR));
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState(() => String(CURRENT_YEAR));
  const [pdfUrl, setPdfUrl] = useState("");
  const [loadingAction, setLoadingAction] = useState<"view" | "download" | null>(null);
  const [error, setError] = useState("");

  const monthRangeDates = useMemo(() => {
    if (!startMonth || !startYear || !endMonth || !endYear) return null;
    const from = `${startYear}-${startMonth.padStart(2, "0")}-01`;
    const lastDayOfEndMonth = `${endYear}-${endMonth.padStart(2, "0")}-${String(lastDayOfMonth(endYear, endMonth)).padStart(2, "0")}`;
    const today = new Date().toISOString().slice(0, 10);
    // Never request a period ending in the future — picking the current month
    // as the end previously sent its last calendar day (e.g. the 31st) even
    // though the month isn't over yet, and the API rejected that range.
    const to = lastDayOfEndMonth > today ? today : lastDayOfEndMonth;
    return { from, to };
  }, [endMonth, endYear, startMonth, startYear]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  async function loadReport(action: "view" | "download") {
    let effectiveFrom = from;
    let effectiveTo = to;

    if (isFinancial) {
      if (!monthRangeDates) {
        setError("يرجى اختيار شهر البداية وشهر النهاية.");
        return;
      }

      const span = monthSpan(startYear, startMonth, endYear, endMonth);
      if (span < 0) {
        setError("يجب أن يكون شهر البداية قبل شهر النهاية أو مساويًا له.");
        return;
      }

      if (span > 2) {
        setError("لا يمكن أن تتجاوز الفترة 3 أشهر متتالية.");
        return;
      }

      effectiveFrom = monthRangeDates.from;
      effectiveTo = monthRangeDates.to;

      if (effectiveFrom > effectiveTo) {
        setError("لا يمكن اختيار فترة مستقبلية بالكامل.");
        return;
      }
    } else if (!from || !to) {
      setError("يرجى اختيار تاريخ البداية وتاريخ النهاية.");
      return;
    } else if (from > to) {
      setError("يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساويًا له.");
      return;
    }

    setLoadingAction(action);
    setError("");

    try {
      const search = new URLSearchParams({ from: effectiveFrom, to: effectiveTo });
      const reportResponse = await requestAuthenticatedBlob(
        `${REPORTS_API_BASE}/${type}?${search.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/pdf, application/json" },
        },
      );

      if (!reportResponse.contentType.includes("application/pdf")) {
        throw new Error("استجابة الخادم ليست ملف PDF صالحًا.");
      }

      const blob = reportResponse.blob;
      const nextPdfUrl = URL.createObjectURL(blob);

      if (action === "download") {
        const downloadLink = document.createElement("a");
        downloadLink.href = nextPdfUrl;
        downloadLink.download = reportResponse.fileName ?? report.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(nextPdfUrl), 1_000);
      } else {
        setPdfUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextPdfUrl;
        });
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "حدث خطأ غير متوقع أثناء تحميل التقرير.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title={report.title} subtitle={report.subtitle} />

      <Card className="p-4 sm:p-5">
        <form
          className="space-y-5"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void loadReport("view");
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-content">فترة التقرير</h2>
              <p className="mt-1 text-xs text-content-muted">
                {isFinancial
                  ? "اضغط زر الفترة الزمنية لتحديد شهر البداية وشهر النهاية (بحد أقصى 3 أشهر متتالية)."
                  : "اضغط زر الفترة الزمنية لتحديد تاريخ البداية والنهاية."}
              </p>
            </div>
            <button
              type="button"
              aria-expanded={showDateFilter}
              onClick={() => {
                setShowDateFilter((current) => !current);
                setError("");
              }}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-medium transition",
                showDateFilter
                  ? "border-gold bg-gold-soft text-gold"
                  : "border-border bg-surface text-content-muted hover:border-gold hover:text-gold",
              )}
            >
              <Icon name="calendar" size={17} />
              فترة زمنية
            </button>
          </div>

          {showDateFilter ? (
            isFinancial ? (
              <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <Field label="من شهر" htmlFor={`${type}-report-start-month`}>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      id={`${type}-report-start-month`}
                      aria-label="شهر البداية"
                      value={startMonth}
                      onChange={(event) => setStartMonth(event.target.value)}
                    >
                      <option value="" disabled>
                        اختر الشهر
                      </option>
                      {SYRIAC_MONTHS.map((name, index) => (
                        <option key={name} value={index + 1}>
                          {monthLabel(index + 1)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="سنة البداية"
                      value={startYear}
                      onChange={(event) => setStartYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Field>
                <Field label="إلى شهر" htmlFor={`${type}-report-end-month`}>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      id={`${type}-report-end-month`}
                      aria-label="شهر النهاية"
                      value={endMonth}
                      onChange={(event) => setEndMonth(event.target.value)}
                    >
                      <option value="" disabled>
                        اختر الشهر
                      </option>
                      {SYRIAC_MONTHS.map((name, index) => (
                        <option key={name} value={index + 1}>
                          {monthLabel(index + 1)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="سنة النهاية"
                      value={endYear}
                      onChange={(event) => setEndYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <Field label="من تاريخ" htmlFor={`${type}-report-from`}>
                  <DatePicker
                    id={`${type}-report-from`}
                    value={from}
                    max={to || undefined}
                    onChange={(value) => setFrom(value)}
                  />
                </Field>
                <Field label="إلى تاريخ" htmlFor={`${type}-report-to`}>
                  <DatePicker
                    id={`${type}-report-to`}
                    value={to}
                    min={from || undefined}
                    onChange={(value) => setTo(value)}
                  />
                </Field>
              </div>
            )
          ) : null}

          {error ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="submit" disabled={!showDateFilter || loadingAction !== null}>
              <Icon name={loadingAction === "view" ? "clock" : "eye"} size={18} />
              {loadingAction === "view" ? "جارٍ عرض التقرير..." : "عرض التقرير"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!showDateFilter || loadingAction !== null}
              onClick={() => void loadReport("download")}
            >
              <Icon name={loadingAction === "download" ? "clock" : "file"} size={18} />
              {loadingAction === "download" ? "جارٍ تحميل التقرير..." : "تحميل التقرير"}
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
                افتح «فترة زمنية» وحدد التاريخ، ثم اعرض التقرير أو حمّله مباشرة.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
