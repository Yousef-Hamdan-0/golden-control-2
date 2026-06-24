"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import type { InventoryPart, InventoryPartInput } from "@/models/inventory/inventory.model";

export function PartFormModal({
  onClose,
  onSave,
  initialPart,
  submitting = false,
  submitError,
}: {
  onClose: () => void;
  onSave: (input: InventoryPartInput) => void;
  initialPart?: InventoryPart | null;
  submitting?: boolean;
  submitError?: string;
}) {
  const [name, setName] = useState(initialPart?.name ?? "");
  const [sku, setSku] = useState(initialPart?.sku ?? "");
  const [location, setLocation] = useState(initialPart?.shelfLocation ?? "");
  const [valueSyp, setValueSyp] = useState(String(initialPart?.costSyp ?? ""));
  const [valueUsd, setValueUsd] = useState(String(initialPart?.costUsd ?? ""));
  const [pendingInput, setPendingInput] = useState<InventoryPartInput | null>(null);
  const isEdit = Boolean(initialPart);

  function buildInput(): InventoryPartInput {
    return {
      name,
      sku,
      shelfLocation: location,
      costSyp: Number(valueSyp) || 0,
      costUsd: Number(valueUsd) || 0,
    };
  }

  function saveInput(input: InventoryPartInput) {
    onSave(input);
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل قطعة" : "إضافة قطعة"}
        description={isEdit ? "تعديل بيانات القطعة وقيمتها وموقعها." : "إضافة قطعة جديدة إلى مخزون قطع الغيار."}
        onClose={onClose}
        widthClassName="max-w-2xl"
      >
        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          {submitError ? (
            <div className="whitespace-pre-line rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger md:col-span-2">
              {submitError}
            </div>
          ) : null}
          <Field label="اسم القطعة">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: شاشة iPhone 13 Pro"
              disabled={submitting}
            />
          </Field>
          <Field label="رمز التخزين">
            <Input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="SCR-IP13-001"
              dir="ltr"
              disabled={submitting}
            />
          </Field>
          <Field label="قيمة القطعة بالليرة السورية">
            <Input
              value={valueSyp}
              onChange={(event) => setValueSyp(event.target.value)}
              type="number"
              min={0}
              placeholder="25000"
              disabled={submitting}
            />
          </Field>
          <Field label="قيمة القطعة بالدولار">
            <Input
              value={valueUsd}
              onChange={(event) => setValueUsd(event.target.value)}
              type="number"
              min={0}
              step="0.01"
              placeholder="7.14"
              disabled={submitting}
            />
          </Field>
          <Field label="الموقع" className="md:col-span-2">
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="رف 3 - صف 2 - مكان 1"
              disabled={submitting}
            />
          </Field>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => {
                const input = buildInput();
                if (isEdit) setPendingInput(input);
                else saveInput(input);
              }}
            >
              <Icon name={isEdit ? "pencil" : "plus"} size={18} />
              {submitting ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديل" : "إضافة القطعة"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingInput ? (
        <ConfirmToast
          title="تأكيد تعديل القطعة"
          message={`هل تريد حفظ التعديلات على القطعة ${pendingInput.name}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          isLoading={submitting}
          onCancel={() => setPendingInput(null)}
          onConfirm={() => saveInput(pendingInput)}
        />
      ) : null}
    </>
  );
}
