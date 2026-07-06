"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE } from "@/config/constants";
import { PayrollAdjustmentFormModal } from "@/features/payroll-adjustments/components/PayrollAdjustmentFormModal";
import { DEFAULT_PAYROLL_MONTH } from "@/features/payroll-adjustments/data/payroll-adjustments.mock";
import { usePayrollRecordMutations, usePayrollRecordsQuery } from "@/features/payroll-adjustments/hooks/use-payroll-records";
import {
  PAYROLL_ADJUSTMENT_LABELS,
  formatPayrollDate,
  formatPayrollMonth,
  type PayrollAdjustment,
  type PayrollAdjustmentFilter,
  type PayrollAdjustmentInput,
  type PayrollAdjustmentType,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { useUsersQuery } from "@/features/users/hooks/use-users-query";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { formatMoney } from "@/lib/format/currency";
import { localDisplayDateTime } from "@/lib/format/date";
import { Icon, type IconName } from "@/lib/icons";
import { ROLE_LABELS_AR, type User } from "@/models/auth/user.model";

const ADJUSTMENT_TONES: Record<PayrollAdjustmentType, BadgeTone> = {
  salary: "gold",
  bonus: "success",
  deduction: "danger",
  overtime: "info",
  commission: "success",
};

const EMPTY_ADJUSTMENTS: readonly PayrollAdjustment[] = [];
const EMPTY_USERS: readonly User[] = [];

interface SummaryCard {
  label: string;
  value: number;
  icon: IconName;
  iconClassName: string;
}

function payrollFilterFromValue(value: string): PayrollAdjustmentFilter {
  if (
    value === "salary" ||
    value === "bonus" ||
    value === "deduction" ||
    value === "overtime" ||
    value === "commission"
  ) {
    return value;
  }

  return "all";
}

export function PayrollAdjustmentsScreen() {
  const toast = useToast();
  const [month, setMonth] = useState(DEFAULT_PAYROLL_MONTH);
  const [typeFilter, setTypeFilter] = useState<PayrollAdjustmentFilter>("all");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] =
    useState<PayrollAdjustment | null>(null);
  const [yearValue, monthValue] = month.split("-").map(Number);
  const listParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      type: typeFilter,
      year: yearValue,
      month: monthValue,
    }),
    [monthValue, page, typeFilter, yearValue],
  );

  const payrollQuery = usePayrollRecordsQuery(listParams);
  const usersQuery = useUsersQuery({
    role: "all",
    status: "all",
    page: 1,
    pageSize: 1000,
  });
  const { create, remove } = usePayrollRecordMutations();
  const adjustments = payrollQuery.data?.items ?? EMPTY_ADJUSTMENTS;
  const users = usersQuery.data?.items ?? EMPTY_USERS;

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  useEffect(() => {
    if (payrollQuery.error) {
      toast.error("تعذر جلب تسويات الرواتب", getApiErrorMessage(payrollQuery.error));
    }
  }, [payrollQuery.error, toast]);

  useEffect(() => {
    if (usersQuery.error) {
      toast.error("تعذر جلب المستخدمين", getApiErrorMessage(usersQuery.error));
    }
  }, [usersQuery.error, toast]);

  const totals = useMemo(
    () =>
      adjustments.reduce(
        (summary, adjustment) => {
          summary[adjustment.type] += adjustment.amount;
          return summary;
        },
        { salary: 0, bonus: 0, deduction: 0, overtime: 0, commission: 0 },
      ),
    [adjustments],
  );
  const additionsTotal = totals.bonus + totals.overtime + totals.commission;

  const summaryCards: readonly SummaryCard[] = [
    {
      label: "مجموع المبالغ المخصومة من الموظفين",
      value: totals.deduction,
      icon: "alert",
      iconClassName: "bg-danger-soft text-danger",
    },
    {
      label: "مجموع الرواتب",
      value: totals.salary,
      icon: "wallet",
      iconClassName: "bg-info-soft text-info",
    },
    {
      label: "مجموع الإضافات",
      value: additionsTotal,
      icon: "chart",
      iconClassName: "bg-success-soft text-success",
    },
  ];

  const totalAdjustments = payrollQuery.data?.total ?? adjustments.length;
  const pages = Math.max(1, Math.ceil(totalAdjustments / PAGE_SIZE));
  const currentPage = Math.min(payrollQuery.data?.page ?? page, pages);
  const visibleAdjustments = adjustments;
  const isLoading = payrollQuery.isLoading || usersQuery.isLoading;
  const loadError = payrollQuery.error || usersQuery.error;

  function createAdjustment(input: PayrollAdjustmentInput) {
    const user = usersById.get(input.userId);
    create.mutate(
      { input, month },
      {
        onSuccess: () => {
          setTypeFilter("all");
          setPage(1);
          setShowCreateModal(false);
          toast.success(
            "تم إنشاء تسوية الراتب",
            `تمت إضافة تسوية ${PAYROLL_ADJUSTMENT_LABELS[input.type]} لـ ${user?.fullName ?? "المستخدم"} بنجاح.`,
          );
        },
        onError: (error) => {
          toast.error("تعذر إنشاء تسوية الراتب", getApiErrorMessage(error));
        },
      },
    );
  }

  function deleteAdjustment(adjustment: PayrollAdjustment) {
    remove.mutate(adjustment.id, {
      onSuccess: () => {
        setAdjustmentToDelete(null);
        toast.success(
          "تم حذف تسوية الراتب",
          `تم حذف تسوية ${PAYROLL_ADJUSTMENT_LABELS[adjustment.type]} بنجاح.`,
        );
      },
      onError: (error) => {
        toast.error("تعذر حذف تسوية الراتب", getApiErrorMessage(error));
      },
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="تسويات الرواتب"
          subtitle="إدارة السلف والخصومات والزيادات الشهرية لمستخدمي النظام."
        />
        <Button
          type="button"
          disabled={usersQuery.isLoading}
          onClick={() => {
            create.reset();
            if (!users.length) {
              toast.error("لا يمكن إنشاء تسوية", "تعذر العثور على مستخدمين من الـ API.");
              return;
            }
            setShowCreateModal(true);
          }}
        >
          <Icon name="plus" size={18} />
          إنشاء تسوية رواتب
        </Button>
      </div>

      {showCreateModal ? (
        <PayrollAdjustmentFormModal
          users={users}
          initialMonth={month}
          submitting={create.isPending}
          submitError={create.error ? getApiErrorMessage(create.error) : ""}
          submitLabel={create.isPending ? "جاري الحفظ..." : "إنشاء التسوية"}
          onClose={() => {
            if (!create.isPending) setShowCreateModal(false);
          }}
          onSave={createAdjustment}
        />
      ) : null}

      {adjustmentToDelete ? (
        <ConfirmToast
          title="تأكيد حذف تسوية الراتب"
          message={`هل تريد حذف تسوية ${PAYROLL_ADJUSTMENT_LABELS[adjustmentToDelete.type]}؟`}
          confirmLabel={remove.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
          isLoading={remove.isPending}
          onCancel={() => {
            if (!remove.isPending) setAdjustmentToDelete(null);
          }}
          onConfirm={() => deleteAdjustment(adjustmentToDelete)}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="flex min-h-32 items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm text-content-muted">{card.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-content">
                {formatMoney(card.value, "SYP")}
              </p>
              <p className="mt-1 text-xs text-content-muted">
                عن شهر {formatPayrollMonth(month)}
              </p>
            </div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${card.iconClassName}`}>
              <Icon name={card.icon} size={21} />
            </span>
          </Card>
        ))}
      </div>

      <Card className="grid gap-4 p-4 sm:grid-cols-2">
        <Field label="نوع التسوية" htmlFor="payroll-filter-type">
          <Select
            id="payroll-filter-type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(payrollFilterFromValue(event.target.value));
              setPage(1);
            }}
          >
            <option value="all">كل التسويات</option>
            <option value="salary">راتب</option>
            <option value="bonus">مكافأة</option>
            <option value="deduction">خصم</option>
            <option value="overtime">عمل إضافي</option>
            <option value="commission">عمولة</option>
          </Select>
        </Field>

        <Field label="الشهر والسنة" htmlFor="payroll-filter-month">
          <Input
            id="payroll-filter-month"
            type="month"
            dir="ltr"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value || DEFAULT_PAYROLL_MONTH);
              setPage(1);
            }}
          />
        </Field>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {[
                  "اسم الموظف",
                  "الدور",
                  "الحالة",
                  "المبلغ بالليرة",
                  "الملاحظة",
                  "وقت الإنشاء",
                  "الإجراءات",
                ].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                    جاري تحميل تسويات الرواتب...
                  </td>
                </tr>
              ) : visibleAdjustments.length ? (
                visibleAdjustments.map((adjustment) => {
                  const user = usersById.get(adjustment.userId);

                  return (
                    <tr key={adjustment.id} className="border-t border-border hover:bg-gold-soft">
                      <td className="px-4 py-4 font-semibold text-content">
                        {user?.fullName ?? "مستخدم غير محدد"}
                      </td>
                      <td className="px-4 py-4 text-content-muted">
                        {user ? ROLE_LABELS_AR[user.role] : "غير محدد"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={ADJUSTMENT_TONES[adjustment.type]}>
                          {PAYROLL_ADJUSTMENT_LABELS[adjustment.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-medium text-content" dir="ltr">
                        {formatMoney(adjustment.amount, "SYP")}
                      </td>
                      <td className="max-w-64 px-4 py-4 text-content-muted">
                        {adjustment.note || "لا توجد"}
                      </td>
                      <td className="px-4 py-4 text-content-muted">
                        {localDisplayDateTime(
                          adjustment.createdAt || `${adjustment.date}T00:00:00`,
                          formatPayrollDate(adjustment.date),
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          aria-label={`حذف تسوية ${user?.fullName ?? adjustment.id}`}
                          title="حذف"
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                          onClick={() => setAdjustmentToDelete(adjustment)}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                    {loadError
                      ? "تعذر تحميل تسويات الرواتب من الـ API."
                      : "لا توجد تسويات رواتب مطابقة للفلاتر المختارة."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={totalAdjustments}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="تسوية"
        />
      </Card>
    </div>
  );
}
