"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { MonthYearFilter } from "@/components/ui/MonthYearFilter";
import { useToast } from "@/components/ui/Toast";
import { MonthlyDuesCard } from "@/features/monthly-dues/components/MonthlyDuesCard";
import { sumMonthlyDues } from "@/features/monthly-dues/models/monthly-dues.model";
import {
  useMonthlyDuesArrestMutation,
  useMonthlyDuesQuery,
} from "@/features/monthly-dues/hooks/use-monthly-dues";
import { formatPayrollMonth } from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { formatMoney } from "@/lib/format/currency";
import { todayDateKey } from "@/lib/format/date";
import { Icon } from "@/lib/icons";
import type { MonthlyDueUser } from "@/features/monthly-dues/models/monthly-dues.model";

const EMPTY_DUES: readonly MonthlyDueUser[] = [];

export function MonthlyDuesScreen() {
  const toast = useToast();
  const currentMonth = todayDateKey().slice(0, 7);
  const [filterYear, setFilterYear] = useState(() => currentMonth.split("-")[0]);
  const [filterMonth, setFilterMonth] = useState(() => String(Number(currentMonth.split("-")[1])));

  const filterMonthKey =
    filterYear && filterMonth ? `${filterYear}-${filterMonth.padStart(2, "0")}` : "";
  const yearValue = filterYear ? Number(filterYear) : undefined;
  const monthValue = filterMonth ? Number(filterMonth) : undefined;
  const hasSelectedMonth = Boolean(yearValue && monthValue);

  const duesQuery = useMonthlyDuesQuery(
    hasSelectedMonth ? { year: yearValue!, month: monthValue! } : null,
  );
  const arrestMutation = useMonthlyDuesArrestMutation();

  useEffect(() => {
    if (duesQuery.error) {
      toast.error("تعذر جلب المستحقات الشهرية", getApiErrorMessage(duesQuery.error));
    }
  }, [duesQuery.error, toast]);

  const monthlyDues = duesQuery.data?.users ?? EMPTY_DUES;
  const isLoading = duesQuery.isLoading;
  const loadError = duesQuery.error;

  const totalDues = useMemo(() => sumMonthlyDues(monthlyDues), [monthlyDues]);

  const handleArrest = (monthlyDuesId: string) => {
    arrestMutation.mutate(monthlyDuesId, {
      onSuccess: () => toast.success("تم تسليم المستحقات", "تم تحديث حالة التسليم بنجاح."),
      onError: (error) => toast.error("تعذر تسليم المستحقات", getApiErrorMessage(error)),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="المستحقات الشهرية"
        subtitle="إجمالي مستحقات كل الموظفين والمستخدمين عن شهر محدد."
      />

      <Card className="grid gap-4 p-4 sm:grid-cols-2">
        <MonthYearFilter
          idPrefix="monthly-dues-filter"
          year={filterYear}
          month={filterMonth}
          onYearChange={setFilterYear}
          onMonthChange={setFilterMonth}
        />
      </Card>

      <Card className="flex min-h-32 items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-content-muted">إجمالي المستحقات الشهرية لكل الموظفين</p>
          <p className="mt-2 font-heading text-2xl font-bold text-content">
            {formatMoney(totalDues, "SYP")}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            {hasSelectedMonth ? `عن ${formatPayrollMonth(filterMonthKey)}` : "الرجاء اختيار الشهر والسنة"}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold">
          <Icon name="wallet" size={21} />
        </span>
      </Card>

      {!hasSelectedMonth ? (
        <Card className="p-12 text-center text-content-muted">
          الرجاء اختيار الشهر والسنة لعرض مستحقات الموظفين.
        </Card>
      ) : isLoading ? (
        <Card className="p-12 text-center text-content-muted">جاري تحميل المستحقات الشهرية...</Card>
      ) : loadError ? (
        <Card className="p-12 text-center text-content-muted">تعذر تحميل بيانات المستحقات من الـ API.</Card>
      ) : monthlyDues.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {monthlyDues.map((due) => (
            <MonthlyDuesCard
              key={due.userId}
              due={due}
              onArrest={handleArrest}
              isArresting={arrestMutation.isPending && arrestMutation.variables === due.monthlyDuesId}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-content-muted">لا يوجد مستخدمون لعرض مستحقاتهم.</Card>
      )}
    </div>
  );
}
