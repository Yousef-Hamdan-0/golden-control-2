"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CounterInput } from "@/components/ui/CounterInput";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useInventoryAllPartsQuery } from "@/features/inventory/hooks/use-inventory";
import { Icon } from "@/lib/icons";
import {
  REASON_MAX_LENGTH,
  type CustodyPartsInput,
  type TechnicianCustody,
  type TechnicianCustodyPart,
} from "@/models/technician/custody.model";

interface PartRow {
  partId: string;
  name: string;
  quantity: number;
}

export function UpdatePartsModal({
  custody,
  technicianName,
  isSaving,
  onSave,
  onClose,
}: {
  custody: TechnicianCustody;
  technicianName: string;
  isSaving: boolean;
  onSave: (input: CustodyPartsInput) => void;
  onClose: () => void;
}) {
  const partsQuery = useInventoryAllPartsQuery();
  const catalog = partsQuery.data ?? [];
  const [rows, setRows] = useState<PartRow[]>(() =>
    custody.parts.map((part) => ({ ...part })),
  );
  const [reason, setReason] = useState("");

  function addRow() {
    setRows((current) => [...current, { partId: "", name: "", quantity: 1 }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, position) => position !== index));
  }

  function patchRow(index: number, patch: Partial<PartRow>) {
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, ...patch } : row)),
    );
  }

  const hasEmptyRow = rows.some((row) => !row.partId);
  const canSave =
    !hasEmptyRow && reason.trim() !== "" && !isSaving && !partsQuery.isLoading;

  return (
    <Modal
      title="تحديث القطع"
      description={`قطع عهدة الفني ${technicianName}. الكمية المُدخلة هي الكمية النهائية.`}
      onClose={onClose}
      widthClassName="max-w-3xl"
    >
      <form
        dir="rtl"
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          const parts: TechnicianCustodyPart[] = rows.map(({ partId, name, quantity }) => ({
            partId,
            name,
            quantity,
          }));
          onSave({ parts, reason: reason.trim() });
        }}
      >
        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-content-muted">لا توجد قطع في العهدة حالياً.</p>
          ) : null}

          {rows.map((row, index) => {
            // A part already chosen in another row is not offered again.
            const takenElsewhere = new Set(
              rows.filter((_, position) => position !== index).map((other) => other.partId),
            );
            const options = catalog.filter(
              (part) => part.id === row.partId || !takenElsewhere.has(part.id),
            );

            return (
              <div
                key={`${row.partId}-${index}`}
                className="grid gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto] lg:items-end"
              >
                <Field label="القطعة">
                  <Select
                    value={row.partId}
                    disabled={isSaving || partsQuery.isLoading}
                    onChange={(event) => {
                      const selected = catalog.find((part) => part.id === event.target.value);
                      patchRow(index, {
                        partId: selected?.id ?? "",
                        name: selected?.name ?? "",
                      });
                    }}
                  >
                    <option value="">اختر قطعة</option>
                    {options.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div>
                  <div className="mb-1.5 text-sm text-content-muted">الكمية</div>
                  <CounterInput
                    value={row.quantity}
                    min={0}
                    disabled={isSaving}
                    aria-label={`كمية ${row.name || "القطعة"}`}
                    onChange={(quantity) => patchRow(index, { quantity })}
                  />
                </div>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isSaving}
                  aria-label="حذف القطعة"
                  onClick={() => removeRow(index)}
                >
                  <Icon name="trash" size={16} />
                  حذف
                </Button>
              </div>
            );
          })}

          {partsQuery.isError ? (
            <p className="text-xs text-danger">تعذر تحميل قائمة القطع.</p>
          ) : null}
          {hasEmptyRow ? (
            <p className="text-xs text-danger">اختر قطعة لكل صف قبل الحفظ.</p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving || partsQuery.isLoading}
            onClick={addRow}
          >
            <Icon name="plus" size={16} />
            إضافة قطعة
          </Button>
        </div>

        <Field label={`السبب (${reason.length}/${REASON_MAX_LENGTH})`} htmlFor="parts-reason">
          <Input
            id="parts-reason"
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
