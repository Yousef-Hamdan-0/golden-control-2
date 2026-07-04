"use client";

import { useEffect } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { useFinanceSummaryQuery } from "@/features/expenses/hooks/use-expenses";
import { formatMoney } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";

function financeTitle(section?: string[]): string {
  const key = section?.join("/") ?? "";
  if (key.includes("expenses/fixed")) return "المصروفات الثابتة";
  if (key.includes("expenses/variable")) return "المصروفات المتغيرة";
  if (key.includes("sales")) return "المبيعات";
  if (key.includes("profits")) return "الأرباح";
  if (key.includes("reports/maintenance")) return "تقارير الصيانة";
  if (key.includes("reports/technicians")) return "تقارير الفنيين";
  if (key.includes("reports/financial")) return "التقارير المالية";
  return "الإدارة المالية";
}

export function FinanceScreen({ section }: { section?: string[] }) {
  const toast = useToast();
  const title = financeTitle(section);
  const isReport = section?.[0] === "reports";
  const [page, setPage] = useState(1);
  const summaryQuery = useFinanceSummaryQuery({
    startDate: "2000-01-01",
    endDate: new Date().toISOString().slice(0, 10),
  });
  const summary = summaryQuery.data;
  const salesTotal = summary?.totalRevenues ?? 0;
  const expensesTotal = (summary?.fixedCosts ?? 0) + (summary?.variableCosts ?? 0);
  const profit = summary?.netProfit ?? 0;

  const sectionKey = section?.join("/") ?? "";
  const records = [
    {
      id: "FIN-REVENUES",
      title: "إجمالي الإيرادات",
      category: "sales",
      owner: "API المالية",
      date: summary?.periodStart && summary?.periodEnd
        ? `${summary.periodStart.slice(0, 10)} - ${summary.periodEnd.slice(0, 10)}`
        : "غير محدد",
      amount: salesTotal,
    },
    {
      id: "FIN-FIXED",
      title: "المصروفات الثابتة",
      category: "fixed",
      owner: "API المالية",
      date: summary?.periodStart?.slice(0, 10) ?? "غير محدد",
      amount: summary?.fixedCosts ?? 0,
    },
    {
      id: "FIN-VARIABLE",
      title: "المصروفات المتغيرة",
      category: "variable",
      owner: "API المالية",
      date: summary?.periodStart?.slice(0, 10) ?? "غير محدد",
      amount: summary?.variableCosts ?? 0,
    },
    {
      id: "FIN-PARTS",
      title: "تكلفة القطع",
      category: "variable",
      owner: "API المالية",
      date: summary?.periodStart?.slice(0, 10) ?? "غير محدد",
      amount: summary?.partsCosts ?? 0,
    },
  ].filter((record) =>
    sectionKey.includes("fixed")
      ? record.category === "fixed"
      : sectionKey.includes("variable")
        ? record.category === "variable"
        : sectionKey.includes("sales")
          ? record.category === "sales"
          : true,
  );
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (summaryQuery.isError && summaryQuery.error) {
      toast.error("تعذر تحميل البيانات المالية", getApiErrorMessage(summaryQuery.error));
    }
  }, [summaryQuery.error, summaryQuery.isError, toast]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title={title}
        subtitle="مراقبة التدفقات المالية، المصروفات، المبيعات، وصافي الأرباح."
      />
      <KpiCards
        cards={[
          { label: "المبيعات", value: formatMoney(salesTotal), icon: "chart", tone: "success" },
          { label: "المصروفات", value: formatMoney(expensesTotal), icon: "wallet", tone: "gold" },
          { label: "صافي الربح", value: formatMoney(profit), icon: "shield", tone: profit >= 0 ? "success" : "danger" },
          { label: "الفواتير المفتوحة", value: "غير متوفر", icon: "file", tone: "info" },
        ]}
      />

      {isReport ? (
        <Card className="p-5">
          <div className="mb-5 text-right">
            <h3 className="font-heading text-lg font-bold text-content">{title}</h3>
            <p className="text-sm text-content-muted">
              ملخص بصري سريع للاتجاهات الشهرية مع مؤشرات قابلة للاستبدال لاحقًا برسوم بيانية حقيقية.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-6" dir="ltr">
            {["h-[54%]", "h-[72%]", "h-[64%]", "h-[88%]", "h-[76%]", "h-[94%]"].map((heightClass, index) => (
              <div key={heightClass} className="flex h-44 flex-col justify-end rounded-md bg-surface-2 p-3">
                <div
                  className={`rounded-sm bg-gold ${heightClass}`}
                  title={`الشهر ${index + 1}`}
                />
                <span className="mt-2 text-center text-xs text-content-muted">{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-right text-sm">
              <thead>
                <tr className="bg-surface-2 text-content-muted">
                  {["الرقم", "البند", "التصنيف", "المسؤول", "التاريخ", "المبلغ"].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                    <td className="px-4 py-4 font-bold text-gold">{record.id}</td>
                    <td className="px-4 py-4 text-content">{record.title}</td>
                    <td className="px-4 py-4">
                      <Badge tone={record.category === "sales" ? "success" : "gold"}>
                        {record.category === "sales"
                          ? "مبيعات"
                          : record.category === "fixed"
                            ? "ثابت"
                            : "متغير"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">{record.owner}</td>
                    <td className="px-4 py-4 text-content-muted">{record.date}</td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatMoney(record.amount, "SYP")}
                    </td>
                  </tr>
                ))}
                {!summaryQuery.isLoading && !visibleRecords.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-content-muted">
                      لا توجد بيانات مالية من API لهذا القسم.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPage}
            total={records.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            itemLabel="سجل"
          />
        </Card>
      )}
    </div>
  );
}
