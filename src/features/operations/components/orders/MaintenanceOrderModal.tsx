"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";
import type { Order, MaintenanceOrderDraft, DeviceDraft, OrderType, Priority } from "../../types";
import { TECHNICIANS } from "../../data/seed";
import { EMPTY_DEVICE, EMPTY_MAINTENANCE_ORDER, orderToDraft, draftToOrder } from "../../utils/order";
import { typeLabel } from "../../utils/invoice";
import { OrderPdfActionsModal } from "./OrderPdfActionsModal";

export function MaintenanceOrderModal({
  onClose,
  onSave,
  initialOrder,
}: {
  onClose: () => void;
  onSave?: (order: Order) => void;
  initialOrder?: Order;
}) {
  const [draft, setDraft] = useState<MaintenanceOrderDraft>(
    initialOrder ? orderToDraft(initialOrder) : EMPTY_MAINTENANCE_ORDER,
  );
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [pendingEditOrder, setPendingEditOrder] = useState<Order | null>(null);
  const isEdit = Boolean(initialOrder);

  function updateDevice(index: number, patch: Partial<DeviceDraft>) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.map((device, currentIndex) =>
        currentIndex === index ? { ...device, ...patch } : device,
      ),
    }));
  }

  function addDevice() {
    setDraft((current) => ({
      ...current,
      devices: [...current.devices, { ...EMPTY_DEVICE }],
    }));
  }

  function removeDevice(index: number) {
    setDraft((current) => ({
      ...current,
      devices: current.devices.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function handleSubmit() {
    const order = draftToOrder(draft, initialOrder);
    if (isEdit) {
      setPendingEditOrder(order);
      return;
    }

    onSave?.(order);
    setCreatedOrder(order);
  }

  return (
    <>
      <Modal
        title={isEdit ? "تعديل طلب صيانة" : "إنشاء طلب صيانة"}
        description="أدخل بيانات الطلب، العميل، الأجهزة، العطل، وموعد الزيارة."
        onClose={onClose}
        widthClassName="max-w-5xl"
      >
        <form className="space-y-6 p-5" onSubmit={(event) => event.preventDefault()}>
          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">موقع الطلب</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["internal", "external"] as OrderType[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, location: value }))}
                  className={[
                    "rounded-md border px-4 py-3 text-right text-sm transition",
                    draft.location === value
                      ? "border-gold bg-gold-soft text-gold"
                      : "border-border bg-surface-2 text-content hover:bg-gold-soft",
                  ].join(" ")}
                >
                  {typeLabel(value)}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">بيانات العميل</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="الاسم">
                <Input
                  value={draft.clientName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, clientName: event.target.value }))
                  }
                  placeholder="اسم العميل"
                />
              </Field>
              <Field label="الهاتف 1">
                <Input
                  dir="ltr"
                  value={draft.phone1}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone1: event.target.value }))
                  }
                  placeholder="09xx xxx xxx"
                />
              </Field>
              <Field label="الهاتف 2">
                <Input
                  dir="ltr"
                  value={draft.phone2}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, phone2: event.target.value }))
                  }
                  placeholder="اختياري"
                />
              </Field>
              <Field label="العنوان">
                <Input
                  value={draft.address}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="دمشق / المزة / شارع الجلاء"
                />
              </Field>
              <Field label="رابط الموقع (اختياري)" className="md:col-span-2">
                <Input
                  dir="ltr"
                  value={draft.locationUrl}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, locationUrl: event.target.value }))
                  }
                  placeholder="https://maps.google.com/?q=Damascus+Mezzeh"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-base font-bold text-gold">بيانات الأجهزة</h3>
              <Button type="button" variant="outline" size="sm" onClick={addDevice}>
                <Icon name="plus" size={16} />
                جهاز آخر
              </Button>
            </div>
            <div className="space-y-3">
              {draft.devices.map((device, index) => (
                <div key={index} className="rounded-md border border-border bg-surface-2 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-content">جهاز {index + 1}</span>
                    {draft.devices.length > 1 ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeDevice(index)}
                      >
                        <Icon name="trash" size={16} />
                        حذف
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field label="نوع الجهاز">
                      <Input
                        value={device.type}
                        onChange={(event) => updateDevice(index, { type: event.target.value })}
                        placeholder="ثلاجة / غسالة / شاشة"
                      />
                    </Field>
                    <Field label="اسم الجهاز">
                      <Input
                        value={device.name}
                        onChange={(event) => updateDevice(index, { name: event.target.value })}
                        placeholder="اسم الجهاز"
                      />
                    </Field>
                    <Field label="الماركة">
                      <Input
                        value={device.brand}
                        onChange={(event) => updateDevice(index, { brand: event.target.value })}
                        placeholder="LG / Samsung..."
                      />
                    </Field>
                    <Field label="الموديل (اختياري)">
                      <Input
                        value={device.model}
                        onChange={(event) => updateDevice(index, { model: event.target.value })}
                        placeholder="رقم الموديل"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">بيانات العطل</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="وصف العطل">
                <Textarea
                  className="min-h-28"
                  value={draft.faultDescription}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      faultDescription: event.target.value,
                    }))
                  }
                  placeholder="اكتب وصف العطل هنا"
                />
              </Field>
              <Field label="ملاحظات (اختياري)">
                <Textarea
                  className="min-h-28"
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="أي ملاحظات إضافية"
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">تاريخ التسليم / الزيارة</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="التاريخ">
                <Input
                  type="date"
                  value={draft.visitDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, visitDate: event.target.value }))
                  }
                />
              </Field>
              <Field label="الوقت">
                <Input
                  type="time"
                  value={draft.visitTime}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, visitTime: event.target.value }))
                  }
                />
              </Field>
              <Field label="الأولوية">
                <Select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as Priority,
                    }))
                  }
                >
                  <option value="low">منخفضة (Low)</option>
                  <option value="medium">متوسطة (Medium)</option>
                  <option value="high">عالية (High)</option>
                  <option value="emergency">طارئة (Emergency)</option>
                </Select>
              </Field>
              <Field label="الفني (اختياري)">
                <Select
                  value={draft.technician}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, technician: event.target.value }))
                  }
                >
                  <option value="">بدون تحديد</option>
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.name}>
                      {tech.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" onClick={handleSubmit}>
              <Icon name={isEdit ? "pencil" : "plus"} size={18} />
              {isEdit ? "حفظ التعديل" : "إنشاء الطلب"}
            </Button>
          </div>
        </form>
      </Modal>
      {createdOrder ? (
        <OrderPdfActionsModal
          order={createdOrder}
          onClose={() => {
            setCreatedOrder(null);
            onClose();
          }}
        />
      ) : null}
      {pendingEditOrder ? (
        <ConfirmToast
          title="تأكيد تعديل الطلب"
          message={`هل تريد حفظ التعديلات على الطلب ${pendingEditOrder.id}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditOrder(null)}
          onConfirm={() => {
            onSave?.(pendingEditOrder);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}
