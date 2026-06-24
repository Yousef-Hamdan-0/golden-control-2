"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import type { InventoryMovementType, InventoryPart } from "@/models/inventory/inventory.model";
import { INVENTORY_MOVEMENT_LABELS } from "../../constants";

export function QuantityAdjustmentModal({
  items,
  onClose,
  onSave,
}: {
  items: InventoryPart[];
  onClose: () => void;
  onSave: (partId: string, movementType: InventoryMovementType, quantity: number) => void;
}) {
  const [partId, setPartId] = useState(items[0]?.id ?? "");
  const [movementType, setMovementType] = useState<"supply" | "adjustment">("supply");
  const [quantity, setQuantity] = useState("1");
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    partId: string;
    movementType: "supply" | "adjustment";
    quantity: number;
    partName: string;
  } | null>(null);
  const selectedPart = items.find((item) => item.id === partId);
  const numericQuantity = Number(quantity) || 0;
  const delta = movementType === "supply" ? Math.max(0, numericQuantity) : numericQuantity;
  const nextStock = selectedPart ? Math.max(0, selectedPart.quantity + delta) : 0;
  const wouldDropBelowZero = Boolean(selectedPart && selectedPart.quantity + delta < 0);
  const canSave = Boolean(selectedPart) && delta !== 0 && !wouldDropBelowZero;

  return (
    <Modal
      title="تعديل الكمية"
      description="اختر القطعة ونوع الحركة لتعديل كمية المخزون."
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <form className="space-y-5 p-5" onSubmit={(event) => event.preventDefault()}>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-right">
              <div className="text-xs text-content-muted">القطعة المحددة</div>
              <div className="mt-1 font-heading text-lg font-bold text-content">
                {selectedPart?.name ?? "لا توجد قطعة"}
              </div>
              <div className="mt-1 text-xs text-content-muted" dir="ltr">
                {selectedPart?.sparePartNumber || selectedPart?.sku || selectedPart?.id || "-"}
              </div>
            </div>
            <Badge tone={INVENTORY_MOVEMENT_LABELS[movementType].tone} dot>
              {INVENTORY_MOVEMENT_LABELS[movementType].label}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="القطعة">
            <Select value={partId} onChange={(event) => setPartId(event.target.value)}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                  {item.name} - {item.sparePartNumber || item.sku}
                    </option>
                  ))}
            </Select>
          </Field>
          <Field label="نوع الحركة">
            <Select
              value={movementType}
              onChange={(event) => {
                const nextType = event.target.value as "supply" | "adjustment";
                setMovementType(nextType);
                setQuantity(nextType === "supply" && Number(quantity) <= 0 ? "1" : quantity);
              }}
            >
              <option value="supply">توريد</option>
              <option value="adjustment">تسوية</option>
            </Select>
          </Field>
          <Field label={movementType === "supply" ? "كمية التوريد" : "قيمة التسوية"}>
            <Input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              min={movementType === "supply" ? 1 : undefined}
              placeholder={movementType === "supply" ? "مثال: 5" : "مثال: 5 أو -3"}
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">الكمية الحالية</div>
            <div className="mt-1 font-heading text-2xl font-bold text-content">{selectedPart?.quantity ?? 0}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">قيمة الحركة</div>
            <div className={cn("mt-1 font-heading text-2xl font-bold", delta < 0 ? "text-danger" : "text-success")}>
              {delta > 0 ? `+${delta}` : delta}
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-content-muted">الكمية بعد التعديل</div>
            <div className="mt-1 font-heading text-2xl font-bold text-gold">{nextStock}</div>
          </div>
        </div>

        {movementType === "supply" ? (
          <p className="text-sm text-content-muted">حركة التوريد تزيد الكمية فقط.</p>
        ) : (
          <p className="text-sm text-content-muted">حركة التسوية تقبل رقماً موجباً أو سالباً.</p>
        )}
        {wouldDropBelowZero ? (
          <p className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            لا يمكن أن تصبح كمية القطعة أقل من صفر.
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!selectedPart || delta === 0) return;
              setPendingAdjustment({
                partId: selectedPart.id,
                movementType,
                quantity: delta,
                partName: selectedPart.name,
              });
            }}
          >
            <Icon name="pencil" size={18} />
            حفظ تعديل الكمية
          </Button>
        </div>
      </form>
      {pendingAdjustment ? (
        <ConfirmToast
          title="تأكيد تعديل الكمية"
          message={`هل تريد حفظ تعديل كمية ${pendingAdjustment.partName}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingAdjustment(null)}
          onConfirm={() => {
            onSave(pendingAdjustment.partId, pendingAdjustment.movementType, pendingAdjustment.quantity);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}
