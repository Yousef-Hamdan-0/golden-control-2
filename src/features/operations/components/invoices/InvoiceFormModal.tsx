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
import { cn } from "@/lib/utils/cn";
import { PAGE_SIZE } from "@/config/constants";
import { useInventoryAllPartsQuery } from "@/features/inventory/hooks/use-inventory";
import { useRequestsQuery } from "@/features/requests/hooks/use-requests";
import type { RepairRequest } from "@/models/requests/request.model";
import type { Invoice, InvoicePart, PaymentStatus, PaymentMethod } from "../../types";
import { TECHNICIANS } from "../../data/seed";
import { USD_TO_SYP_RATE } from "../../constants";
import {
  typeLabel,
  invoicePartTotal,
  invoicePartsTotal,
  getTechnicianPhone,
} from "../../utils/invoice";
import { DetailItem } from "../shared/DetailItem";

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
  const draftTotal = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
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
      technician: request.technicianName || "غير محدد",
      technicianPhone: "",
      centerPullItems: request.status === "pulltocenter" ? request.faultDescription : draft.centerPullItems,
    });
  }

  function patchPaymentStatus(status: PaymentStatus) {
    const total = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
    patchDraft({
      status,
      paid: status === "paid" ? total : status === "unpaid" ? 0 : Math.min(Number(draft.paid) || 0, total),
    });
  }

  function patchPaid(value: string) {
    const total = invoicePartsTotal(draft.parts) || Math.max(0, Number(draft.total) || 0);
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
    const partsTotal = invoicePartsTotal(parts);
    const total = partsTotal > 0 ? partsTotal : Math.max(0, Number(draft.total) || 0);
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
                paidAt: draft.issuedAt || new Date().toISOString().slice(0, 10),
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
      technicianPhone: draft.technicianPhone || getTechnicianPhone(draft.technician),
      total,
      paid,
      status: nextStatus,
      requestNumber: draft.requestNumber,
      issuedAt: draft.issuedAt || new Date().toISOString().slice(0, 10),
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
          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="grid gap-3 md:grid-cols-4">
              <DetailItem label="رقم الفاتورة" value={draft.id} ltr />
              {isCreate && !lockRequest ? (
                <Field label="الطلب">
                  <div className="grid gap-2">
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
                    {requestsQuery.isError ? (
                      <p className="text-xs text-danger">تعذر تحميل الطلبات لاختيار الفاتورة.</p>
                    ) : null}
                  </div>
                </Field>
              ) : (
                <DetailItem label="رقم الطلب" value={draft.requestNumber || draft.orderId} ltr />
              )}
              <DetailItem label="نوع الفاتورة" value={typeLabel(draft.type)} />
              <DetailItem label="تاريخ الإصدار" value={draft.issuedAt} />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم العميل">
              <Input value={draft.client} onChange={(event) => patchDraft({ client: event.target.value })} placeholder="اسم العميل" />
            </Field>
            <Field label="رقم 1">
              <Input value={draft.clientPhone} onChange={(event) => patchDraft({ clientPhone: event.target.value })} dir="ltr" placeholder="09xx xxx xxx" />
            </Field>
            <Field label="رقم 2">
              <Input value={draft.clientPhone2 ?? ""} onChange={(event) => patchDraft({ clientPhone2: event.target.value })} dir="ltr" placeholder="اختياري" />
            </Field>
            <Field label="العنوان">
              <Input value={draft.clientAddress ?? ""} onChange={(event) => patchDraft({ clientAddress: event.target.value })} placeholder="دمشق - المزة - شارع الجلاء" />
            </Field>
            <Field label="اسم الفني">
              <Select
                value={draft.technician}
                onChange={(event) => {
                  const technician = event.target.value;
                  patchDraft({ technician, technicianPhone: getTechnicianPhone(technician) });
                }}
              >
                {TECHNICIANS.map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
                <option value="غير محدد">غير محدد</option>
              </Select>
            </Field>
            <Field label="رقم تلفون الفني">
              <Input value={draft.technicianPhone ?? ""} onChange={(event) => patchDraft({ technicianPhone: event.target.value })} dir="ltr" placeholder="09xx xxx xxx" />
            </Field>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold text-gold">حالة الفاتورة</h3>
            <div className="grid gap-3 sm:grid-cols-3">
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
                <div key={`${part.id}-${index}`} className="rounded-md border border-border bg-surface p-4">
                  {(() => {
                    const selectedPart = availableSpareParts.find(
                      (sparePart) => sparePart.id === part.sparePartId,
                    );
                    return selectedPart ? (
                      <div className="mb-3 text-xs text-content-muted">
                        الكمية المتوفرة من القطعة المختارة: {selectedPart.quantity}
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-start justify-between gap-3">
                    <Field label="قطعة الغيار" className="flex-1">
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
                      {!partsQuery.isLoading && availableSpareParts.length === 0 ? (
                        <p className="mt-1 text-xs text-content-muted">
                          لا توجد قطع غيار متوفرة حالياً.
                        </p>
                      ) : null}
                      {partsQuery.isError ? (
                        <p className="mt-1 text-xs text-danger">
                          تعذر تحميل قطع الغيار. حدّث الصفحة ثم حاول مرة أخرى.
                        </p>
                      ) : null}
                    </Field>
                    <Button type="button" variant="danger" size="sm" onClick={() => removePart(index)} disabled={draft.parts.length <= 1}>
                      <Icon name="trash" size={16} />
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <Field label="السعر لكل قطعة حسب العملة">
                      <Input
                        value={String(part.unitPrice)}
                        onChange={(event) => patchPart(index, { unitPrice: Number(event.target.value) })}
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        placeholder={draft.currency === "USD" ? "دولار" : "ليرة سورية"}
                      />
                    </Field>
                    <div>
                      <div className="mb-1.5 text-sm text-content-muted">الكمية</div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-9 w-9 px-0" onClick={() => stepPartQuantity(index, 1)}>
                          +
                        </Button>
                        <span className="min-w-8 text-center font-heading text-lg font-bold text-content">{part.quantity}</span>
                        <Button type="button" variant="outline" size="sm" className="h-9 w-9 px-0" onClick={() => stepPartQuantity(index, -1)}>
                          -
                        </Button>
                      </div>
                    </div>
                    <DetailItem label="إجمالي القطعة" value={formatMoney(invoicePartTotal(part), draft.currency)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-sm font-medium text-content-muted">
            **ملاحظة سعر الصرف الحالي لكل 1 دولار = {formatMoney(USD_TO_SYP_RATE, "SYP")}
          </p>

          <Card className="space-y-4 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-gold">تفاصيل المبالغ</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <DetailItem label="المبلغ الكلي" value={formatMoney(draftTotal, draft.currency)} />
              <Field label="المبلغ المدفوع">
                <Input value={String(draftPaid)} onChange={(event) => patchPaid(event.target.value)} type="number" min={0} placeholder="0.00" dir="ltr" />
              </Field>
              <DetailItem label="المبلغ المتبقي" value={formatMoney(draftRemaining, draft.currency)} />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="مدة الكفالة" className="md:col-span-2">
              <Input value={draft.warrantyDuration ?? ""} onChange={(event) => patchDraft({ warrantyDuration: event.target.value })} placeholder="مثال: 6 أشهر" />
            </Field>
            <Field label="الأجهزة أو القطع التي تحتاج صيانة في المركز (اختياري)" className="md:col-span-2">
              <Textarea value={draft.centerPullItems ?? ""} onChange={(event) => patchDraft({ centerPullItems: event.target.value })} className="min-h-24" placeholder="اكتب أي ملاحظات تتعلق بالأجهزة والقطع التي تم سحبها إلى المركز هنا..." />
            </Field>
            <Field label="ملاحظات إضافية (اختياري)" className="md:col-span-2">
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
