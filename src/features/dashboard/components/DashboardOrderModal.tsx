"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Input } from "@/components/ui/Input";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  type ModalMode,
  type RecentOrder,
  requestStatusMeta,
} from "@/features/dashboard/components/dashboard-overview.helpers";
import {
  REQUEST_STATUS_OPTIONS,
  type RepairRequestStatus,
} from "@/models/requests/request.model";

export function DashboardOrderModal({
  order,
  mode,
  onClose,
  onSave,
}: {
  order: RecentOrder;
  mode: ModalMode;
  onClose: () => void;
  onSave: (order: RecentOrder) => void;
}) {
  const [draft, setDraft] = useState(order);
  const [pendingEditOrder, setPendingEditOrder] = useState<RecentOrder | null>(null);
  const isEdit = mode === "edit";

  return (
    <OverlayPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-order-modal-title"
        className="fixed inset-0 z-[100] flex h-dvh min-h-dvh w-dvw items-center justify-center overflow-y-auto overscroll-contain bg-black/60 px-4 py-6"
      >
        <Card className="max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="text-right">
              <h3 id="recent-order-modal-title" className="font-heading text-lg font-bold text-content">
                {isEdit ? "تعديل الطلب" : "تفاصيل الطلب"}
              </h3>
              <p className="text-sm text-content-muted">
                #{order.requestNumber || order.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-3 py-1.5 text-sm text-content-muted transition hover:bg-surface-2"
            >
              إغلاق
            </button>
          </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>العميل</span>
            <Input
              value={draft.client}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, client: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>رقم الهاتف</span>
            <Input
              value={draft.phone}
              dir="ltr"
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الجهاز</span>
            <Input
              value={draft.device}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, device: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الفني المسؤول</span>
            <Input
              value={draft.technician}
              readOnly={!isEdit}
              onChange={(event) =>
                setDraft((value) => ({ ...value, technician: event.target.value }))
              }
            />
          </label>
          <label className="space-y-1.5 text-right text-sm text-content-muted">
            <span>الحالة</span>
            <Select
              value={draft.status}
              disabled={!isEdit}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  status: event.target.value as RepairRequestStatus,
                }))
              }
            >
              {REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end justify-end">
            <Badge tone={requestStatusMeta(draft.status).tone} dot>
              {requestStatusMeta(draft.status).label}
            </Badge>
          </div>
          <label className="space-y-1.5 text-right text-sm text-content-muted md:col-span-2">
            <span>الملاحظات</span>
            <Textarea
              className="min-h-28"
              value={draft.notes}
              readOnly={!isEdit}
              onChange={(event) => setDraft((value) => ({ ...value, notes: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Link
            href={`/orders?id=${order.id}`}
            className="text-sm font-medium text-gold transition hover:text-gold-hover"
          >
            فتح في صفحة الطلبات
          </Link>
          {isEdit ? (
            <Button type="button" onClick={() => setPendingEditOrder(draft)}>
              حفظ التعديل
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              تم
            </Button>
          )}
        </div>
      </Card>
      {pendingEditOrder ? (
        <ConfirmToast
          title="تأكيد تعديل الطلب"
          message={`هل تريد حفظ التعديلات على الطلب ${pendingEditOrder.requestNumber}؟`}
          tone="gold"
          confirmLabel="تأكيد التعديل"
          onCancel={() => setPendingEditOrder(null)}
          onConfirm={() => onSave(pendingEditOrder)}
        />
      ) : null}
      </div>
    </OverlayPortal>
  );
}
