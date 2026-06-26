"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import type { Currency } from "@/lib/format/currency";
import { todayDateKey } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";
import { PAGE_SIZE } from "@/config/constants";
import { useInventoryAllPartsQuery } from "@/features/inventory/hooks/use-inventory";
import { useRequestsQuery } from "@/features/requests/hooks/use-requests";
import type { RepairRequest } from "@/models/requests/request.model";
import type { Invoice, InvoicePart, PaymentStatus, PaymentMethod } from "../../types";
import { USD_TO_SYP_RATE } from "../../constants";
import {
  invoicePartTotal,
  invoicePartsTotal,
} from "../../utils/invoice";

function requestOptionLabel(request: RepairRequest) {
  const customer = request.customer.name || "عميل غير محدد";
  return `${request.requestNumber || request.id} - ${customer}`;
}

export function InvoiceFormModal({
  invoice,
  mode = "edit",
  onClose,
  onSave,
  submitting = false,
  submitError,
  lockRequest = false,
}: {
  invoice: Invoice;
  mode?: "create" | "edit";
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  submitting?: boolean;
  submitError?: string;
  lockRequest?: boolean;
}) {
  const [draft, setDraft] = useState<Invoice>(invoice);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const [requestSearch, setRequestSearch] = useState(invoice.requestNumber || "");
  const isCreate = mode === "create";
  const requestsQuery = useRequestsQuery({
    page: 1,
    pageSize: PAGE_SIZE,
    type: draft.type,
    search: requestSearch.trim() || undefined,
  });
  const partsQuery = useInventoryAllPartsQuery();
  const repairRequests = requestsQuery.data?.items ?? [];
  const spareParts = partsQuery.data ?? [];
  const availableSpareParts = spareParts.filter((part) => part.quantity >= 1);
  const partsTotal = invoicePartsTotal(draft.parts);
  const draftTotal = Math.max(0, Number(draft.total) || 0);
  const draftPaid = Math.min(draftTotal, Math.max(0, Number(draft.paid) || 0));
  const draftRemaining = Math.max(0, draftTotal - draftPaid);

  function patchDraft(patch: Partial<Invoice>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function selectRepairRequest(requestId: string) {
    const request = repairRequests.find((item) => item.id === requestId);
    if (!request) {
      patchDraft({ orderId: "", requestNumber: "" });
      return;
    }

    setRequestSearch(request.requestNumber || request.customer.name);
    patchDraft({
      orderId: request.id,
      requestNumber: request.requestNumber,
      type: request.type,
      client: request.customer.name,
      clientPhone: request.customer.firstPhone,
      clientPhone2: request.customer.secondPhone,
      clientAddress: request.customer.address,
      locationURL: request.customer.locationLink,
      technician: request.technicianName || "غير محدد",
      technicianPhone: "",
      centerPullItems: request.status === "pulltocenter" ? request.faultDescription : draft.centerPullItems,
    });
  }

  function patchPaymentStatus(status: PaymentStatus) {
    const total = Math.max(0, Number(draft.total) || 0);
    patchDraft({
      status,
      paid: status === "paid" ? total : status === "unpaid" ? 0 : Math.min(Number(draft.paid) || 0, total),
    });
  }

  function patchTotal(value: string) {
    const total = Math.max(0, Number(value) || 0);
    const paid = Math.min(total, Math.max(0, Number(draft.paid) || 0));
    patchDraft({
      total,
      paid,
      status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
    });
  }

  function patchPaid(value: string) {
    const total = Math.max(0, Number(draft.total) || 0);
    const paid = Math.min(total, Math.max(0, Number(value) || 0));
    patchDraft({
      paid,
      status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
    });
  }

  function patchPart(index: number, patch: Partial<InvoicePart>) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.map((part, currentIndex) =>
        currentIndex === index ? { ...part, ...patch } : part,
      ),
    }));
  }

  function addPart() {
    setDraft((current) => ({
      ...current,
      parts: [
        ...current.parts,
        {
          id: `PRT-${Date.now().toString().slice(-4)}`,
          sparePartId: "",
          name: "",
          quantity: 1,
          unitPrice: 0,
          currency: current.currency,
        },
      ],
    }));
  }

  function removePart(index: number) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function stepPartQuantity(index: number, step: number) {
    const currentQuantity = Math.max(1, Number(draft.parts[index]?.quantity) || 1);
    const selectedPart = availableSpareParts.find(
      (sparePart) => sparePart.id === draft.parts[index]?.sparePartId,
    );
    const nextQuantity = Math.max(1, currentQuantity + step);
    patchPart(index, {
      quantity: selectedPart ? Math.min(selectedPart.quantity, nextQuantity) : nextQuantity,
    });
  }

  function buildInvoice(): Invoice {
    const parts = draft.parts.map((part, index) => ({
      ...part,
      id: part.id || `PRT-${index + 1}`,
      sparePartId: part.sparePartId,
      name: part.name || "قطعة غير محددة",
      quantity: Math.max(1, Number(part.quantity) || 1),
      unitPrice: Math.max(0, Number(part.unitPrice) || 0),
      currency: part.currency ?? draft.currency,
    }));
    const total = Math.max(0, Number(draft.total) || 0);
    const paid = Math.min(total, Math.max(0, Number(draft.paid) || 0));
    const nextStatus: PaymentStatus =
      paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : draft.status === "paid" ? "partial" : draft.status;
    const payments =
      !isCreate && draft.payments.length > 0
        ? draft.payments
        : paid > 0
          ? [
              {
                id: `PAY-${Date.now().toString().slice(-5)}`,
                amount: paid,
                convertedAmount: paid,
                currency: draft.currency,
                method: draft.paymentMethod,
                paidAt: draft.issuedAt || todayDateKey(),
              },
            ]
          : [];

    return {
      ...draft,
      client: draft.client || "عميل غير محدد",
      clientPhone: draft.clientPhone || "غير محدد",
      clientPhone2: draft.clientPhone2 || "لا يوجد",
      clientAddress: draft.clientAddress || "غير محدد",
      technician: draft.technician || "غير محدد",
      technicianPhone: draft.technicianPhone || "",
      total,
      paid,
      status: nextStatus,
      requestNumber: draft.requestNumber,
      issuedAt: draft.issuedAt || todayDateKey(),
      warrantyDuration: draft.warrantyDuration || "غير محددة",
      centerPullItems: draft.centerPullItems ?? "",
      notes: draft.notes ?? "",
      parts,
      payments,
    };
  }

  return (
    <>
      <Modal
        title={isCreate ? "إنشاء فاتورة" : `تعديل الفاتورة ${invoice.id}`}
        description={isCreate ? "إنشاء فاتورة مرتبطة بالطلب مع القطع، المبالغ، الدفع، والكفالة." : "تعديل بيانات الفاتورة والقطع والدفعات الأساسية."}
        onClose={onClose}
        widthClassName="max-w-6xl"
      >
        <form className="space-y-5 p-5" onSubmit={(event) => event.preventDefault()}>
          {submitError ? (
            <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              {submitError}
            </div>
          ) : null}
          <div className="rounded-md border border-border bg-surface-2 px-4 py-3">
            {isCreate && !lockRequest ? (
              <Field label="الطلب المرتبط">
                <div className="grid gap-2 md:grid-cols-[minmax(240px,1fr)_minmax(260px,1.4fr)]">
                  <Input
                    value={requestSearch}
                    onChange={(event) => {
                      setRequestSearch(event.target.value);
                      patchDraft({ orderId: "", requestNumber: "" });
                    }}
                    placeholder="ابحث برقم الطلب، العميل أو الهاتف"
                    disabled={submitting}
                  />
                  <Select
                    value={draft.orderId}
                    onChange={(event) => selectRepairRequest(event.target.value)}
                    disabled={submitting || requestsQuery.isLoading}
                  >
                    <option value="">
                      {requestsQuery.isLoading ? "جاري تحميل الطلبات..." : "اختر الطلب..."}
                    </option>
                    {draft.orderId && !repairRequests.some((request) => request.id === draft.orderId) ? (
                      <option value={draft.orderId}>
                        {draft.requestNumber || draft.orderId}
                      </option>
                    ) : null}
                    {repairRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {requestOptionLabel(request)}
                      </option>
                    ))}
                  </Select>
                </div>
                {requestsQuery.isError ? (
                  <p className="text-xs text-danger">تعذر تحميل الطلبات لاختيار الفاتورة.</p>
                ) : null}
              </Field>
            ) : (
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <div className="text-content-muted">الطلب المرتبط</div>
                  <div className="mt-1 font-bold text-content" dir="ltr">
                    {draft.requestNumber || draft.orderId}
                  </div>
                </div>
                <div>
                  <div className="text-content-muted">نوع الفاتورة</div>
                  <div className="mt-1 font-bold text-content">
                    {draft.type === "internal" ? "داخلي" : "خارجي"}
                  </div>
                </div>
                <div>
                  <div className="text-content-muted">تاريخ الإصدار</div>
                  <div className="mt-1 font-bold text-content">{draft.issuedAt}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">حالة الفاتورة</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["paid", "مدفوعة بالكامل"],
                ["partial", "مدفوعة جزئياً"],
              ] as Array<[PaymentStatus, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patchPaymentStatus(value)}
                  className={cn(
                    "rounded-md border px-4 py-3 text-center font-heading text-base font-bold transition",
                    draft.status === value
                      ? "border-gold bg-gold-soft text-gold-active"
                      : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden shadow-none">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-gold">قطع الغيار المستخدمة</h3>
              <Button type="button" variant="outline" size="sm" onClick={addPart}>
                <Icon name="plus" size={16} />
                إضافة قطعة
              </Button>
            </div>
            <div className="space-y-3 p-4">
              {draft.parts.map((part, index) => (
                <div key={`${part.id}-${index}`} className="rounded-md border border-border bg-surface p-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_150px_150px_150px_auto] lg:items-end">
                    <Field label="قطعة الغيار">
                      <Select
                        value={part.sparePartId ?? ""}
                        disabled={submitting || partsQuery.isLoading}
                        onChange={(event) => {
                          const sparePart = availableSpareParts.find((item) => item.id === event.target.value);
                          patchPart(index, {
                            id: sparePart?.id ?? part.id,
                            sparePartId: sparePart?.id ?? "",
                            name: sparePart?.name ?? "",
                            unitPrice:
                              draft.currency === "USD"
                                ? (sparePart?.costUsd ?? part.unitPrice)
                                : (sparePart?.costSyp ?? part.unitPrice),
                            currency: draft.currency,
                          });
                        }}
                      >
                        <option value="">اختر قطعة غيار</option>
                        {availableSpareParts.map((sparePart) => (
                          <option key={sparePart.id} value={sparePart.id}>
                            {sparePart.name} - {sparePart.sparePartNumber} (المتوفر: {sparePart.quantity})
                          </option>
                        ))}
                      </Select>
                      {(() => {
                        const selectedPart = availableSpareParts.find(
                          (sparePart) => sparePart.id === part.sparePartId,
                        );
                        return selectedPart ? (
                          <span className="text-xs text-content-muted">
                            المتوفر: {selectedPart.quantity}
                          </span>
                        ) : null;
                      })()}
                      {!partsQuery.isLoading && availableSpareParts.length === 0 ? (
                        <span className="text-xs text-content-muted">لا توجد قطع غيار متوفرة حالياً.</span>
                      ) : null}
                      {partsQuery.isError ? (
                        <span className="text-xs text-danger">تعذر تحميل قطع الغيار.</span>
                      ) : null}
                    </Field>
                    <Field label="السعر">
                      <Input
                        value={String(part.unitPrice)}
                        onChange={(event) => patchPart(index, { unitPrice: Number(event.target.value) })}
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        className="h-10"
                        placeholder={draft.currency === "USD" ? "USD" : "SYP"}
                      />
                    </Field>
                    <div>
                      <div className="mb-1.5 text-sm text-content-muted">الكمية</div>
                      <div className="grid h-10 grid-cols-[36px_1fr_36px] items-center overflow-hidden rounded-md border border-border bg-surface-2">
                        <button
                          type="button"
                          className="h-full text-content-muted hover:bg-gold-soft hover:text-gold"
                          onClick={() => stepPartQuantity(index, 1)}
                        >
                          +
                        </button>
                        <span className="text-center font-heading text-base font-bold text-content">{part.quantity}</span>
                        <button
                          type="button"
                          className="h-full text-content-muted hover:bg-gold-soft hover:text-gold"
                          onClick={() => stepPartQuantity(index, -1)}
                        >
                          -
                        </button>
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
                      <div className="text-xs text-content-muted">الإجمالي</div>
                      <div className="mt-1 font-heading text-sm font-bold text-gold">
                        {formatMoney(invoicePartTotal(part), draft.currency)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="h-10 px-3"
                      onClick={() => removePart(index)}
                      disabled={draft.parts.length <= 1}
                    >
                      <Icon name="trash" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-sm font-medium text-content-muted">
            ملاحظة: سعر الصرف الحالي لكل 1 دولار = {formatMoney(USD_TO_SYP_RATE, "SYP")}
          </p>

          <Card className="space-y-4 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-gold">تفاصيل المبالغ</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <Field label="المبلغ الكلي">
                  <Input
                    value={String(draftTotal)}
                    onChange={(event) => patchTotal(event.target.value)}
                    type="number"
                    min={0}
                    placeholder="0.00"
                    dir="ltr"
                    disabled={submitting}
                  />
                </Field>
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <Field label="المبلغ المدفوع">
                  <Input
                    value={String(draftPaid)}
                    onChange={(event) => patchPaid(event.target.value)}
                    type="number"
                    min={0}
                    placeholder="0.00"
                    dir="ltr"
                    disabled={submitting}
                  />
                </Field>
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-sm text-content-muted">المبلغ المتبقي</div>
                <div className="mt-3 h-11 rounded-md border border-border bg-surface px-3 py-2 text-left font-heading text-base font-bold text-gold" dir="ltr">
                  {formatMoney(draftRemaining, draft.currency)}
                </div>
              </div>
            </div>
            {partsTotal > 0 ? (
              <p className="text-xs text-content-muted">
                إجمالي قطع الغيار المحسوب: {formatMoney(partsTotal, draft.currency)}
              </p>
            ) : null}
          </Card>

          <div className="space-y-4">
            <Field label="نوع الدفع">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["cash", "كاش"],
                  ["sham-cash", "شام كاش"],
                ] as Array<[PaymentMethod, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ paymentMethod: value })}
                    className={cn(
                      "rounded-md border px-4 py-3 font-heading font-bold transition",
                      draft.paymentMethod === value
                        ? "border-gold bg-gold-soft text-gold-active"
                        : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="نوع العملة">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["USD", "دولار"],
                  ["SYP", "ليرة سورية"],
                ] as Array<[Currency, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ currency: value })}
                    className={cn(
                      "rounded-md border px-4 py-3 font-heading font-bold transition",
                      draft.currency === value
                        ? "border-gold bg-gold-soft text-gold-active"
                        : "border-border bg-surface text-content-muted hover:bg-gold-soft hover:text-gold",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="مدة الكفالة">
              <Input value={draft.warrantyDuration ?? ""} onChange={(event) => patchDraft({ warrantyDuration: event.target.value })} placeholder="مثال: 6 أشهر" />
            </Field>
            <Field label="الأجهزة أو القطع التي تحتاج صيانة في المركز (اختياري)">
              <Textarea value={draft.centerPullItems ?? ""} onChange={(event) => patchDraft({ centerPullItems: event.target.value })} className="min-h-24" placeholder="اكتب أي ملاحظات تتعلق بالأجهزة والقطع التي تم سحبها إلى المركز هنا..." />
            </Field>
            <Field label="ملاحظات إضافية (اختياري)">
              <Textarea value={draft.notes ?? ""} onChange={(event) => patchDraft({ notes: event.target.value })} className="min-h-24" placeholder="اكتب أي ملاحظات تتعلق بالصيانة هنا..." />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="button" disabled={submitting} onClick={() => setPendingInvoice(buildInvoice())}>
              <Icon name={isCreate ? "plus" : "pencil"} size={18} />
              {submitting ? "جاري الحفظ..." : isCreate ? "إنشاء وإرسال الفاتورة" : "حفظ التعديل"}
            </Button>
          </div>
        </form>
      </Modal>
      {pendingInvoice ? (
        <ConfirmToast
          title={isCreate ? "تأكيد إنشاء الفاتورة" : "تأكيد تعديل الفاتورة"}
          message={isCreate ? `هل تريد إنشاء الفاتورة ${pendingInvoice.id} ومعاينتها؟` : `هل تريد حفظ التعديلات على الفاتورة ${pendingInvoice.id}؟`}
          tone="gold"
          confirmLabel={isCreate ? "إنشاء الفاتورة" : "تأكيد التعديل"}
          onCancel={() => setPendingInvoice(null)}
          onConfirm={() => {
            onSave(pendingInvoice);
            setPendingInvoice(null);
          }}
        />
      ) : null}
    </>
  );
}
