"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CURRENCY_SYMBOL } from "@/config/constants";
import {
  PAYROLL_ADJUSTMENT_LABELS,
  type PayrollAdjustmentInput,
} from "@/features/payroll-adjustments/models/payroll-adjustment.model";
import { Icon } from "@/lib/icons";
import type { User } from "@/models/auth/user.model";

interface PayrollAdjustmentFormModalProps {
  users: readonly User[];
  onClose: () => void;
  onSave: (input: PayrollAdjustmentInput) => void;
}

export function PayrollAdjustmentFormModal({
  users,
  onClose,
  onSave,
}: PayrollAdjustmentFormModalProps) {
  const [draft, setDraft] = useState<PayrollAdjustmentInput>({
    userId: users[0]?.id ?? "",
    type: "advance",
    amount: 0,
    note: "",
  });
  const [error, setError] = useState("");

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized: PayrollAdjustmentInput = {
      ...draft,
      amount: Number(draft.amount),
      note: draft.note.trim(),
    };

    if (!users.some((user) => user.id === normalized.userId)) {
      setError("يرجى اختيار مستخدم صحيح.");
      return;
    }

    if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) {
      setError("يرجى إدخال مبلغ صحيح أكبر من صفر.");
      return;
    }

    setError("");
    onSave(normalized);
    onClose();
  }

  return (
    <Modal
      title="إنشاء تسوية رواتب"
      description="أدخل بيانات التسوية وسيتم تسجيلها ضمن الشهر المختار في الصفحة."
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <form className="space-y-5 p-5" dir="rtl" onSubmit={submitAdjustment}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المستخدم" htmlFor="payroll-user">
            <Select
              id="payroll-user"
              value={draft.userId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, userId: event.target.value }))
              }
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} - {user.jobTitle}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="نوع التسوية" htmlFor="payroll-type">
            <Select
              id="payroll-type"
              value={draft.type}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((current) => ({
                  ...current,
                  type:
                    value === "deduction" || value === "increase" ? value : "advance",
                }));
              }}
            >
              {Object.entries(PAYROLL_ADJUSTMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="المبلغ" htmlFor="payroll-amount" className="sm:col-span-2">
            <div className="relative">
              <Input
                id="payroll-amount"
                type="number"
                min="1"
                step="1000"
                inputMode="numeric"
                dir="ltr"
                className="pl-14"
                value={draft.amount || ""}
                placeholder="0"
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

          <Field label="ملاحظة (اختياري)" htmlFor="payroll-note" className="sm:col-span-2">
            <Textarea
              id="payroll-note"
              rows={4}
              maxLength={300}
              value={draft.note}
              placeholder="اكتب ملاحظة عن التسوية..."
              onChange={(event) =>
                setDraft((current) => ({ ...current, note: event.target.value }))
              }
            />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit">
            <Icon name="plus" size={17} />
            إنشاء التسوية
          </Button>
        </div>
      </form>
    </Modal>
  );
}
