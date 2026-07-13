"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { MonthYearFilter } from "@/components/ui/MonthYearFilter";
import { useToast } from "@/components/ui/Toast";
import { MonthlyDuesCard } from "@/features/monthly-dues/components/MonthlyDuesCard";
import { computeMonthlyDues, sumMonthlyDues } from "@/features/monthly-dues/models/monthly-dues.model";
import { formatPayrollMonth } from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { usePayrollRecordsQuery } from "@/features/payroll-adjustments/hooks/use-payroll-records";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { formatMoney } from "@/lib/format/currency";
import { todayDateKey } from "@/lib/format/date";
import { Icon } from "@/lib/icons";
import type { User } from "@/models/auth/user.model";
import type { PayrollAdjustment } from "@/features/payroll-adjustments/models/payroll-adjustment.model";

const EMPTY_USERS: readonly User[] = [];
const EMPTY_SETTLEMENTS: readonly PayrollAdjustment[] = [];
const MAX_PAGE_SIZE = 1000;

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

  const usersQuery = useUsersQuery({ role: "all", status: "all", page: 1, pageSize: MAX_PAGE_SIZE });
  const payrollQuery = usePayrollRecordsQuery({
    page: 1,
    pageSize: MAX_PAGE_SIZE,
    type: "all",
    year: yearValue,
    month: monthValue,
  });

  useEffect(() => {
    if (usersQuery.error) {
      toast.error("تعذر جلب المستخدمين", getApiErrorMessage(usersQuery.error));
    }
  }, [usersQuery.error, toast]);

  useEffect(() => {
    if (payrollQuery.error) {
      toast.error("تعذر جلب تسويات الرواتب", getApiErrorMessage(payrollQuery.error));
    }
  }, [payrollQuery.error, toast]);

  const users = usersQuery.data?.items ?? EMPTY_USERS;
  const settlements = payrollQuery.data?.items ?? EMPTY_SETTLEMENTS;
  const isLoading = usersQuery.isLoading || payrollQuery.isLoading;
  const loadError = usersQuery.error || payrollQuery.error;

  const monthlyDues = useMemo(
    () => (hasSelectedMonth ? computeMonthlyDues(users, settlements) : []),
    [hasSelectedMonth, users, settlements],
  );
  const totalDues = useMemo(() => sumMonthlyDues(monthlyDues), [monthlyDues]);

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
            <MonthlyDuesCard key={due.user.id} due={due} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-content-muted">لا يوجد مستخدمون لعرض مستحقاتهم.</Card>
      )}
    </div>
  );
}
