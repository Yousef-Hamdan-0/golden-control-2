"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import type { InventoryItem } from "../../types";
import { USD_TO_SYP_RATE } from "../../constants";

export function PartFormModal({
  onClose,
  onSave,
  initialPart,
}: {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  initialPart?: InventoryItem | null;
}) {
  const [name, setName] = useState(initialPart?.name ?? "");
  const [code, setCode] = useState(initialPart?.id ?? "");
  const [location, setLocation] = useState(initialPart?.location ?? "");
  const [valueSyp, setValueSyp] = useState(String(initialPart?.unitCost ?? ""));
  const [valueUsd, setValueUsd] = useState(
    initialPart ? String(Number((initialPart.unitCost / USD_TO_SYP_RATE).toFixed(2))) : "",
  );
  const [pendingEditItem, setPendingEditItem] = useState<InventoryItem | null>(null);
  const isEdit = Boolean(initialPart);

  function buildItem(): InventoryItem {
    return {
      id: code || `PRT-${Date.now().toString().slice(-4)}`,
      name: name || "قطعة جديدة",
      category: initialPart?.category ?? "عام",
      stock: initialPart?.stock ?? 0,
      minStock: initialPart?.minStock ?? 1,
      unitCost: Number(valueSyp) || Math.round((Number(valueUsd) || 0) * USD_TO_SYP_RATE),
      lastMove: isEdit ? "تعديل بيانات" : "إضافة قطعة",
      location: location || "غير محدد",
    };
  }

  function saveItem(item: InventoryItem) {
    onSave(item);
    onClose();
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
          <Field label="اسم القطعة">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: حساس حرارة NTC" />
          </Field>
          <Field label="الكود">
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="PRT-000" dir="ltr" />
          </Field>
          <Field label="قيمة القطعة بالليرة السورية">
            <Input value={valueSyp} onChange={(event) => setValueSyp(event.target.value)} type="number" min={0} placeholder="0" />
          </Field>
          <Field label="قيمة القطعة بالدولار">
            <Input value={valueUsd} onChange={(event) => setValueUsd(event.target.value)} type="number" min={0} step="0.01" placeholder="0" />
          </Field>
          <Field label="الموقع" className="md:col-span-2">
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="رف A-01" />
          </Field>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => {
                const item = buildItem();
                if (isEdit) setPendingEditItem(item);
                else saveItem(item);
              }}
            >
              <Icon name={isEdit ? "pencil" : "plus"} size={18} />
              {isEdit ? "حفظ التعديل" : "إضافة القطعة"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingEditItem ? (
        <ConfirmToast
          title="تأكيد تعديل القطعة"
          message={`هل تريد حفظ التعديلات على القطعة ${pendingEditItem.name}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditItem(null)}
          onConfirm={() => saveItem(pendingEditItem)}
        />
      ) : null}
    </>
  );
}
