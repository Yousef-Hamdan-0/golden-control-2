"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatMoney } from "@/lib/format/currency";
import {
  MOVEMENT_LABELS,
  REASON_MAX_LENGTH,
  type CustodyMovementType,
  type TechnicianCustody,
  type WalletMovementInput,
} from "@/models/technician/custody.model";

export function UpdateWalletModal({
  custody,
  technicianName,
  isSaving,
  onSave,
  onClose,
}: {
  custody: TechnicianCustody;
  technicianName: string;
  isSaving: boolean;
  onSave: (input: WalletMovementInput) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<CustodyMovementType>("supply");

  const numericAmount = Number(amount);
  const amountIsValid = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount > 0;
  const wouldGoNegative =
    type === "withdraw" && amountIsValid && numericAmount > custody.walletBalance;
  const amountError = amount.trim() === ""
    ? undefined
    : !amountIsValid
      ? "أدخل مبلغاً رقمياً أكبر من صفر."
      : wouldGoNegative
        ? `المبلغ يتجاوز الرصيد الحالي (${formatMoney(custody.walletBalance, "SYP")}).`
        : undefined;

  const canSave = amountIsValid && !wouldGoNegative && reason.trim() !== "" && !isSaving;

  return (
    <Modal
      title="تحديث المحفظة"
      description={`الرصيد الحالي: ${formatMoney(custody.walletBalance, "SYP")}`}
      onClose={onClose}
      widthClassName="max-w-lg"
    >
      <form
        dir="rtl"
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          onSave({ amount: numericAmount, type, reason: reason.trim() });
        }}
      >
        <Field label="النوع" htmlFor="wallet-type">
          <Select
            id="wallet-type"
            value={type}
            onChange={(event) => setType(event.target.value as CustodyMovementType)}
          >
            <option value="supply">{MOVEMENT_LABELS.supply}</option>
            <option value="withdraw">{MOVEMENT_LABELS.withdraw}</option>
          </Select>
        </Field>

        <Field label="المبلغ" htmlFor="wallet-amount" error={amountError}>
          <Input
            id="wallet-amount"
            type="number"
            min={1}
            step="any"
            inputMode="decimal"
            dir="ltr"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        <Field label={`السبب (${reason.length}/${REASON_MAX_LENGTH})`} htmlFor="wallet-reason">
          <Input
            id="wallet-reason"
            maxLength={REASON_MAX_LENGTH}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button type="submit" disabled={!canSave}>
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
