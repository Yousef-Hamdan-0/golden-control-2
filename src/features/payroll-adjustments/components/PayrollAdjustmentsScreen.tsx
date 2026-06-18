"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import { PayrollAdjustmentFormModal } from "@/features/payroll-adjustments/components/PayrollAdjustmentFormModal";
import {
  DEFAULT_PAYROLL_MONTH,
  INITIAL_PAYROLL_ADJUSTMENTS,
} from "@/features/payroll-adjustments/data/payroll-adjustments.mock";
import {
  PAYROLL_ADJUSTMENT_LABELS,
  adjustmentDateForMonth,
  formatPayrollDate,
  formatPayrollMonth,
  nextPayrollAdjustmentId,
  type PayrollAdjustment,
  type PayrollAdjustmentFilter,
  type PayrollAdjustmentInput,
  type PayrollAdjustmentType,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { formatMoney } from "@/lib/format/currency";
import { Icon, type IconName } from "@/lib/icons";
import { MOCK_USERS } from "@/mocks/users.mock";
import { ROLE_LABELS_AR } from "@/models/auth/user.model";

const ADJUSTMENT_TONES: Record<PayrollAdjustmentType, BadgeTone> = {
  advance: "info",
  deduction: "danger",
  increase: "success",
};

interface SummaryCard {
  label: string;
  value: number;
  icon: IconName;
  iconClassName: string;
}

export function PayrollAdjustmentsScreen() {
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([
    ...INITIAL_PAYROLL_ADJUSTMENTS,
  ]);
  const [month, setMonth] = useState(DEFAULT_PAYROLL_MONTH);
  const [typeFilter, setTypeFilter] = useState<PayrollAdjustmentFilter>("all");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] =
    useState<PayrollAdjustment | null>(null);

  const usersById = useMemo(
    () => new Map(MOCK_USERS.map((user) => [user.id, user])),
    [],
  );

  const monthlyAdjustments = useMemo(
    () => adjustments.filter((adjustment) => adjustment.date.startsWith(month)),
    [adjustments, month],
  );

  const totals = useMemo(
    () =>
      monthlyAdjustments.reduce(
        (summary, adjustment) => {
          summary[adjustment.type] += adjustment.amount;
          return summary;
        },
        { advance: 0, deduction: 0, increase: 0 },
      ),
    [monthlyAdjustments],
  );

  const filteredAdjustments = useMemo(
    () =>
      monthlyAdjustments.filter(
        (adjustment) => typeFilter === "all" || adjustment.type === typeFilter,
      ),
    [monthlyAdjustments, typeFilter],
  );

  const summaryCards: readonly SummaryCard[] = [
    {
      label: "مجموع المبالغ المخصومة من الموظفين",
      value: totals.deduction,
      icon: "alert",
      iconClassName: "bg-danger-soft text-danger",
    },
    {
      label: "مجموع السلف",
      value: totals.advance,
      icon: "wallet",
      iconClassName: "bg-info-soft text-info",
    },
    {
      label: "مجموع الزيادات",
      value: totals.increase,
      icon: "chart",
      iconClassName: "bg-success-soft text-success",
    },
  ];

  const pages = Math.max(1, Math.ceil(filteredAdjustments.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleAdjustments = filteredAdjustments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function createAdjustment(input: PayrollAdjustmentInput) {
    setAdjustments((current) => [
      {
        id: nextPayrollAdjustmentId(current),
        ...input,
        date: adjustmentDateForMonth(month),
      },
      ...current,
    ]);
    setTypeFilter("all");
    setPage(1);
    setShowCreateModal(false);
  }

  function deleteAdjustment(adjustmentId: string) {
    setAdjustments((current) =>
      current.filter((adjustment) => adjustment.id !== adjustmentId),
    );
    setAdjustmentToDelete(null);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="تسويات الرواتب"
          subtitle="إدارة السلف والخصومات والزيادات الشهرية لمستخدمي النظام."
        />
        <Button type="button" onClick={() => setShowCreateModal(true)}>
          <Icon name="plus" size={18} />
          إنشاء تسوية رواتب
        </Button>
      </div>

      {showCreateModal ? (
        <PayrollAdjustmentFormModal
          users={MOCK_USERS}
          onClose={() => setShowCreateModal(false)}
          onSave={createAdjustment}
        />
      ) : null}

      {adjustmentToDelete ? (
        <ConfirmToast
          title="تأكيد حذف تسوية الراتب"
          message={`هل تريد حذف تسوية ${PAYROLL_ADJUSTMENT_LABELS[adjustmentToDelete.type]}؟`}
          onCancel={() => setAdjustmentToDelete(null)}
          onConfirm={() => deleteAdjustment(adjustmentToDelete.id)}
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
              const value = event.target.value;
              setTypeFilter(
                value === "advance" || value === "deduction" || value === "increase"
                  ? value
                  : "all",
              );
              setPage(1);
            }}
          >
            <option value="all">كل التسويات</option>
            <option value="advance">سلفة</option>
            <option value="deduction">خصم</option>
            <option value="increase">زيادة</option>
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
                  "التاريخ",
                  "الإجراءات",
                ].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleAdjustments.length ? (
                visibleAdjustments.map((adjustment) => {
                  const user = usersById.get(adjustment.userId);

                  return (
                    <tr key={adjustment.id} className="border-t border-border hover:bg-gold-soft">
                      <td className="px-4 py-4 font-semibold text-content">
                        {user?.fullName ?? "مستخدم محذوف"}
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
                        {formatPayrollDate(adjustment.date)}
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
                    لا توجد تسويات رواتب مطابقة للفلاتر المختارة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={filteredAdjustments.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="تسوية"
        />
      </Card>
    </div>
  );
}
