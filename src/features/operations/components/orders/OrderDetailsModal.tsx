"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import { formatMoney } from "@/lib/format/currency";
import { CURRENT_USER } from "@/lib/auth/current-user";
import type { Order, Invoice } from "../../types";
import { INVOICES } from "../../data/seed";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_TONE,
  PAYMENT_LABELS,
} from "../../constants";
import {
  typeLabel,
  remaining,
  getTechnicianPhone,
  createInvoiceDraftFromOrder,
} from "../../utils/invoice";
import { isRepairDecisionStatus, canCreateInvoiceForOrder, getOrderDevices, formatDeviceName, getOrderAudioRecords, getOrderStatusHistory } from "../../utils/order";
import { DetailItem } from "../shared/DetailItem";
import { InvoiceDetailsModal } from "../invoices/InvoiceDetailsModal";
import { InvoiceFormModal } from "../invoices/InvoiceFormModal";

export function OrderDetailsModal({
  order,
  invoice,
  invoices = INVOICES,
  onCreateInvoice,
  onCompleteOrder,
  onClose,
}: {
  order: Order;
  invoice?: Invoice | null;
  invoices?: Invoice[];
  onCreateInvoice?: (invoice: Invoice) => void;
  onCompleteOrder?: (order: Order) => void;
  onClose: () => void;
}) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);
  const activeInvoice = invoice ?? createdInvoice;
  const invoiceBalance = activeInvoice ? remaining(activeInvoice.total, activeInvoice.paid) : 0;
  const devices = getOrderDevices(order);
  const phone2 = order.phone2?.trim() || "لا يوجد";
  const customerLocation = order.locationUrl?.trim();
  const technicianPhone = getTechnicianPhone(order.technician);
  const audioRecords = getOrderAudioRecords(order);
  const statusHistory = getOrderStatusHistory(order);
  const faultDescription = order.faultDescription?.trim() || "لا يوجد وصف عطل مسجل لهذا الطلب.";
  const invoiceDraft = createInvoiceDraftFromOrder(order, invoices);

  function handleInvoiceCreateRequest() {
    setInvoiceNotice(null);

    if (!isRepairDecisionStatus(order.status)) {
      setInvoiceNotice("يمكن إنشاء الفاتورة فقط عندما يكون الطلب مكتملًا أو قيد الإصلاح.");
      return;
    }

    if (!canCreateInvoiceForOrder(order, CURRENT_USER.role)) {
      setInvoiceNotice(
        order.type === "external"
          ? "إنشاء فاتورة الطلب الخارجي متاح فقط لمدير النظام."
          : "لا تملك صلاحية إنشاء فاتورة لهذا الطلب.",
      );
      return;
    }

    if (activeInvoice) {
      setInvoiceNotice("توجد فاتورة مرتبطة بهذا الطلب مسبقاً. يمكنك معاينتها من زر التفاصيل.");
      setShowInvoiceDetails(true);
      return;
    }

    if (!onCreateInvoice) {
      setInvoiceNotice("إنشاء الفواتير متاح من تفاصيل الطلب داخل صفحة إدارة الطلبات.");
      return;
    }

    setShowInvoiceForm(true);
  }

  return (
    <>
      <Modal
        title={`تفاصيل الطلب ${order.id}`}
        description="معلومات العميل، الأجهزة، الفني، الحالة، والفاتورة المرتبطة."
        onClose={onClose}
        widthClassName="max-w-4xl"
      >
        <div className="space-y-5 p-5">
          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">بيانات الطلب</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <DetailItem label="رقم الطلب" value={order.id} ltr />
              <DetailItem label="نوع الطلب" value={typeLabel(order.type)} />
              <DetailItem
                label="حالة الطلب"
                value={
                  <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                }
              />
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">بيانات العميل</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <DetailItem label="اسم العميل" value={order.client} />
              <DetailItem label="رقمه 1" value={order.phone} ltr />
              <DetailItem label="رقمه 2" value={phone2} ltr={Boolean(order.phone2?.trim())} />
              <DetailItem label="عنوان العميل" value={order.address} />
              <DetailItem
                label="رابط موقع العميل"
                value={
                  customerLocation ? (
                    <a href={customerLocation} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-hover">
                      فتح الموقع
                    </a>
                  ) : (
                    "لا يوجد"
                  )
                }
              />
              <DetailItem label="وقت الزيارة" value={order.visitDate} />
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">الأجهزة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["نوع الجهاز", "اسم الجهاز", "الماركة", "الموديل"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => (
                    <tr key={`${device.name}-${index}`} className="border-t border-border">
                      <td className="px-4 py-3 text-content-muted">{device.type || "غير محدد"}</td>
                      <td className="px-4 py-3 font-semibold text-content">{device.name || formatDeviceName(device)}</td>
                      <td className="px-4 py-3 text-content-muted">{device.brand || "غير محدد"}</td>
                      <td className="px-4 py-3 text-content-muted">{device.model || "غير محدد"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">وصف العطل</h3>
            <p className="mt-3 rounded-md border border-border bg-surface p-3 text-sm leading-7 text-content-muted">
              {faultDescription}
            </p>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <h3 className="font-heading text-base font-bold text-content">معلومات الفني</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <DetailItem label="اسم الفني" value={order.technician} />
              <DetailItem label="رقم تلفونه" value={technicianPhone} ltr={technicianPhone !== "لا يوجد"} />
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">التسجيلات الصوتية</h3>
            </div>
            <div className="divide-y divide-border">
              {audioRecords.map((record) => (
                <div key={record.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_0.6fr_0.8fr_1.4fr] md:items-center">
                  <DetailItem label="الاسم" value={record.name} />
                  <DetailItem label="المدة" value={record.duration} ltr />
                  <DetailItem label="التاريخ" value={record.date} />
                  <div>
                    <div className="mb-1.5 text-xs text-content-muted">تشغيل التسجيل</div>
                    <audio controls preload="none" src={record.url} className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-heading text-base font-bold text-content">سجل حالة الطلب</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-right text-sm">
                <thead>
                  <tr className="bg-surface-2 text-content-muted">
                    {["الحالة", "الملاحظة", "المسؤول", "التاريخ"].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Badge tone={ORDER_STATUS_TONE[item.status]} dot>
                          {ORDER_STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-content-muted">{item.note}</td>
                      <td className="px-4 py-3 text-content">{item.owner}</td>
                      <td className="px-4 py-3 text-content-muted">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-surface-2 p-4 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-base font-bold text-content">الفاتورة</h3>
              {activeInvoice ? (
                <button
                  type="button"
                  aria-label={`تفاصيل الفاتورة ${activeInvoice.id}`}
                  title="تفاصيل الفاتورة"
                  onClick={() => setShowInvoiceDetails(true)}
                  className="rounded-sm p-1.5 text-content-muted hover:bg-surface hover:text-content"
                >
                  <Icon name="eye" size={18} />
                </button>
              ) : (
                <Button type="button" size="sm" onClick={handleInvoiceCreateRequest}>
                  <Icon name="plus" size={16} />
                  إنهاء الطلب وإنشاء فاتورة
                </Button>
              )}
            </div>
            {invoiceNotice ? (
              <div className="mt-3 rounded-md border border-gold/30 bg-gold-soft p-3 text-sm font-medium text-gold-active">
                {invoiceNotice}
              </div>
            ) : null}
            {activeInvoice ? (
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <DetailItem label="رقم الفاتورة" value={activeInvoice.id} ltr />
                <DetailItem
                  label="حالة الفاتورة"
                  value={
                    <Badge tone={PAYMENT_TONE[activeInvoice.status]} dot>
                      {PAYMENT_LABELS[activeInvoice.status]}
                    </Badge>
                  }
                />
                <DetailItem label="الإجمالي" value={formatMoney(activeInvoice.total, activeInvoice.currency)} />
                <DetailItem label="المتبقي" value={formatMoney(invoiceBalance, activeInvoice.currency)} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-content-muted">
                لا توجد فاتورة مرتبطة بهذا الطلب حالياً.
              </p>
            )}
          </Card>
        </div>
      </Modal>

      {showInvoiceDetails && activeInvoice ? (
        <InvoiceDetailsModal
          invoice={activeInvoice}
          order={order}
          onClose={() => setShowInvoiceDetails(false)}
        />
      ) : null}
      {showInvoiceForm ? (
        <InvoiceFormModal
          invoice={invoiceDraft}
          mode="create"
          onClose={() => setShowInvoiceForm(false)}
          onSave={(nextInvoice) => {
            setCreatedInvoice(nextInvoice);
            onCreateInvoice?.(nextInvoice);
            if (order.status !== "completed") {
              onCompleteOrder?.({
                ...order,
                status: "completed",
                statusHistory: [
                  ...statusHistory,
                  {
                    id: `HIS-${order.id}-invoice`,
                    status: "completed",
                    note: `تم إنهاء الطلب وإنشاء الفاتورة ${nextInvoice.id}.`,
                    owner: CURRENT_USER.fullName,
                    date: new Date().toISOString().slice(0, 16).replace("T", " "),
                  },
                ],
              });
            }
            setShowInvoiceForm(false);
            setShowInvoiceDetails(true);
          }}
        />
      ) : null}
    </>
  );
}
