"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatMoney } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import { FINANCE_RECORDS } from "../../data/seed";
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
  const title = financeTitle(section);
  const sales = FINANCE_RECORDS.filter((record) => record.category === "sales");
  const expenses = FINANCE_RECORDS.filter((record) => record.category !== "sales");
  const salesTotal = sales.reduce((sum, record) => sum + record.amount, 0);
  const expensesTotal = expenses.reduce((sum, record) => sum + record.amount, 0);
  const profit = salesTotal - expensesTotal;
  const isReport = section?.[0] === "reports";
  const [page, setPage] = useState(1);

  const records = useMemo(() => {
    const key = section?.join("/") ?? "";
    if (key.includes("fixed")) return FINANCE_RECORDS.filter((record) => record.category === "fixed");
    if (key.includes("variable")) return FINANCE_RECORDS.filter((record) => record.category === "variable");
    if (key.includes("sales")) return sales;
    return FINANCE_RECORDS;
  }, [sales, section]);
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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
          { label: "الفواتير المفتوحة", value: "3", icon: "file", tone: "info" },
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
                      {formatMoney(record.amount, record.currency)}
                    </td>
                  </tr>
                ))}
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
