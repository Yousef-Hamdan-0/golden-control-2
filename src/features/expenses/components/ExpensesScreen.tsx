"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { PAGE_SIZE } from "@/config/constants";
import { ExpenseFormModal } from "@/features/expenses/components/ExpenseFormModal";
import {
  DEFAULT_EXPENSE_MONTH,
  INITIAL_EXPENSES,
} from "@/features/expenses/data/expenses.mock";
import {
  EXPENSE_CATEGORY_LABELS,
  formatExpenseMonth,
  nextExpenseId,
  type ExpenseCategoryFilter,
  type ExpenseInput,
  type ExpenseRecord,
} from "@/features/expenses/models/expense.model";
import { formatMoney } from "@/lib/format/currency";
import { Icon } from "@/lib/icons";

interface ExpensesScreenProps {
  initialCategory?: ExpenseCategoryFilter;
}

export function ExpensesScreen({ initialCategory = "all" }: ExpensesScreenProps) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([...INITIAL_EXPENSES]);
  const [category, setCategory] = useState<ExpenseCategoryFilter>(initialCategory);
  const [month, setMonth] = useState(DEFAULT_EXPENSE_MONTH);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  const monthlyFixedTotal = useMemo(
    () =>
      expenses
        .filter((expense) => expense.category === "fixed" && expense.month === month)
        .reduce((total, expense) => total + expense.amount, 0),
    [expenses, month],
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.month === month && (category === "all" || expense.category === category),
      ),
    [category, expenses, month],
  );

  const pages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleExpenses = filteredExpenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function saveExpense(input: ExpenseInput) {
    setExpenses((current) => {
      if (editingExpense) {
        return current.map((expense) =>
          expense.id === editingExpense.id ? { ...expense, ...input } : expense,
        );
      }

      return [{ id: nextExpenseId(current), ...input }, ...current];
    });
    setMonth(input.month);
    setCategory("all");
    setPage(1);
    setEditingExpense(null);
    setShowCreateModal(false);
  }

  function deleteExpense(expenseId: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== expenseId));
    setExpenseToDelete(null);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="المصروفات"
          subtitle="متابعة المصروفات الشهرية الثابتة والمتغيرة وإدارة بنودها."
        />
        <Button type="button" onClick={() => setShowCreateModal(true)}>
          <Icon name="plus" size={18} />
          إنشاء مصروف
        </Button>
      </div>

      {showCreateModal ? (
        <ExpenseFormModal
          initialMonth={month}
          onClose={() => setShowCreateModal(false)}
          onSave={saveExpense}
        />
      ) : null}

      {editingExpense ? (
        <ExpenseFormModal
          expense={editingExpense}
          initialMonth={month}
          onClose={() => setEditingExpense(null)}
          onSave={saveExpense}
        />
      ) : null}

      {expenseToDelete ? (
        <ConfirmToast
          title="تأكيد حذف المصروف"
          message={`هل تريد حذف بند ${expenseToDelete.title} من المصروفات؟`}
          onCancel={() => setExpenseToDelete(null)}
          onConfirm={() => deleteExpense(expenseToDelete.id)}
        />
      ) : null}

      <Card className="grid gap-4 p-4 sm:grid-cols-2">
        <Field label="تصنيف المصروف" htmlFor="expense-filter-category">
          <Select
            id="expense-filter-category"
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value;
              setCategory(
                nextCategory === "fixed" || nextCategory === "variable" ? nextCategory : "all",
              );
              setPage(1);
            }}
          >
            <option value="all">كل التصنيفات</option>
            <option value="fixed">ثابت</option>
            <option value="variable">متغير</option>
          </Select>
        </Field>

        <Field label="الشهر والسنة" htmlFor="expense-filter-month">
          <Input
            id="expense-filter-month"
            type="month"
            dir="ltr"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value || DEFAULT_EXPENSE_MONTH);
              setPage(1);
            }}
          />
        </Field>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {['البند', 'التصنيف', 'التاريخ', 'المبلغ', 'الإجراءات'].map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleExpenses.length ? (
                visibleExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-border hover:bg-gold-soft">
                    <td className="px-4 py-4 font-semibold text-content">{expense.title}</td>
                    <td className="px-4 py-4">
                      <Badge tone={expense.category === "fixed" ? "gold" : "info"}>
                        {EXPENSE_CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-content-muted">
                      {formatExpenseMonth(expense.month)}
                    </td>
                    <td className="px-4 py-4 font-medium text-content" dir="ltr">
                      {formatMoney(expense.amount, "SYP")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-start gap-2" dir="rtl">
                        <button
                          type="button"
                          aria-label={`تعديل ${expense.title}`}
                          title="تعديل"
                          className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                          onClick={() => setEditingExpense(expense)}
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${expense.title}`}
                          title="حذف"
                          className="rounded-sm p-1.5 text-danger hover:bg-danger-soft"
                          onClick={() => setExpenseToDelete(expense)}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-content-muted">
                    لا توجد مصروفات مطابقة للفلاتر المختارة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={filteredExpenses.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="مصروف"
        />
      </Card>

      <div className="flex justify-start">
        <Card className="flex w-full items-center justify-between gap-4 p-4 sm:w-96">
          <div>
            <p className="text-sm text-content-muted">مجموع المصروفات الثابتة الشهري</p>
            <p className="mt-2 font-heading text-2xl font-bold text-content">
              {formatMoney(monthlyFixedTotal, "SYP")}
            </p>
            <p className="mt-1 text-xs text-content-muted">عن شهر {formatExpenseMonth(month)}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold">
            <Icon name="wallet" size={21} />
          </span>
        </Card>
      </div>
    </div>
  );
}
