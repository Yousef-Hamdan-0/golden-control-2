"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { CURRENCY_SYMBOL } from "@/config/constants";
import { Icon } from "@/lib/icons";
import {
  EXPENSE_CATEGORY_LABELS,
  isExpenseMonth,
  type ExpenseInput,
  type ExpenseRecord,
} from "@/features/expenses/models/expense.model";

interface ExpenseFormModalProps {
  initialMonth: string;
  expense?: ExpenseRecord;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onSave: (input: ExpenseInput) => void;
}

export function ExpenseFormModal({
  initialMonth,
  expense,
  submitting = false,
  submitError,
  onClose,
  onSave,
}: ExpenseFormModalProps) {
  const isEdit = Boolean(expense);
  const [draft, setDraft] = useState<ExpenseInput>(() => ({
    title: expense?.title ?? "",
    category: expense?.category ?? "fixed",
    amount: expense?.amount ?? 0,
    month: expense?.month ?? initialMonth,
  }));
  const [error, setError] = useState("");
  const [pendingEdit, setPendingEdit] = useState<ExpenseInput | null>(null);

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized: ExpenseInput = {
      ...draft,
      title: draft.title.trim(),
      amount: Number(draft.amount),
    };

    if (!normalized.title) {
      setError("يرجى إدخال بند المصروف.");
      return;
    }

    if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }

    if (!isExpenseMonth(normalized.month)) {
      setError("يرجى اختيار شهر وسنة صحيحين.");
      return;
    }

    setError("");
    if (isEdit) {
      setPendingEdit(normalized);
      return;
    }

    onSave(normalized);
  }

  function confirmEdit() {
    if (!pendingEdit) return;
    onSave(pendingEdit);
    setPendingEdit(null);
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل المصروف" : "إنشاء مصروف"}
        description="أدخل بيانات المصروف وحدد تصنيفه والشهر الخاص به."
        onClose={onClose}
        widthClassName="max-w-xl"
      >
        <form className="space-y-5 p-5" dir="rtl" onSubmit={submitExpense}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تصنيف المصروف" htmlFor="expense-category">
              <Select
                id="expense-category"
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category:
                      event.target.value === "variable"
                        ? event.target.value
                        : "fixed",
                  }))
                }
                disabled={submitting}
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="البند" htmlFor="expense-title">
              <Input
                id="expense-title"
                value={draft.title}
                maxLength={100}
                placeholder="مثال: إيجار المركز"
                disabled={submitting}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>

            <Field label="المبلغ" htmlFor="expense-amount">
              <div className="relative">
                <Input
                  id="expense-amount"
                  type="number"
                  min="1"
                  step="1000"
                  inputMode="numeric"
                  dir="ltr"
                  className="pl-14"
                  value={draft.amount || ""}
                  placeholder="0"
                  disabled={submitting}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      amount: Number(event.target.value),
                    }))
                  }
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-muted">
                  {CURRENCY_SYMBOL}
                </span>
              </div>
            </Field>

            <Field label="الشهر والسنة" htmlFor="expense-month">
              <Input
                id="expense-month"
                type="month"
                dir="ltr"
                value={draft.month}
                disabled={submitting}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, month: event.target.value }))
                }
              />
            </Field>
          </div>

          {error || submitError ? (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error || submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              <Icon name={isEdit ? "pencil" : "plus"} size={17} />
              {submitting ? "جاري الحفظ..." : isEdit ? "حفظ التعديل" : "إنشاء المصروف"}
            </Button>
          </div>
        </form>
      </Modal>

      {pendingEdit ? (
        <ConfirmToast
          title="تأكيد تعديل المصروف"
          message={`هل تريد حفظ التعديلات على بند ${pendingEdit.title}؟`}
          confirmLabel="تأكيد التعديل"
          tone="gold"
          onCancel={() => setPendingEdit(null)}
          onConfirm={confirmEdit}
          isLoading={submitting}
        />
      ) : null}
    </>
  );
}
