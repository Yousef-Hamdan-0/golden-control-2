"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/lib/icons";
import { formatMoney, type Currency } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import type { Invoice, InvoicePayment, InvoiceType, PaymentStatus, PaymentMethod, DateFilter } from "../../types";
import { ORDERS } from "../../data/seed";
import {
  PAYMENT_TONE,
  PAYMENT_LABELS,
  INVOICES_STORAGE_KEY,
} from "../../constants";
import { readStoredInvoices, writeStoredList } from "../../utils/storage";
import { matchesDateValue, contains } from "../../utils/filter";
import { typeLabel, currencyLabel, remaining } from "../../utils/invoice";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { FilterCard } from "../shared/FilterCard";
import { DateFilterModal } from "../shared/DateFilterModal";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { InvoiceFormModal } from "./InvoiceFormModal";
import { AddPaymentModal } from "./AddPaymentModal";

export function InvoicesScreen() {
  const params = useSearchParams();
  const toast = useToast();
  const initialType = params.get("type") as InvoiceType | null;
  const initialCurrency = params.get("currency")?.toUpperCase() as Currency | undefined;
  const [invoices, setInvoices] = useState<Invoice[]>(readStoredInvoices);
  const [type, setType] = useState<InvoiceType | "all">(initialType ?? "all");
  const [currency, setCurrency] = useState<Currency | "all">(initialCurrency ?? "all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);

  const filtered = invoices.filter((invoice) => {
    const byType = type === "all" || invoice.type === type;
    const byCurrency = currency === "all" || invoice.currency === currency;
    const byStatus = status === "all" || invoice.status === status;
    const byPaymentMethod = paymentMethod === "all" || invoice.paymentMethod === paymentMethod;
    const byQuery =
      !query ||
      contains(invoice.id, query) ||
      contains(invoice.clientPhone, query);
    const byDate = matchesDateValue(invoice.issuedAt, dateFilter);
    return byType && byCurrency && byStatus && byPaymentMethod && byQuery && byDate;
  });

  const total = filtered.reduce((sum, invoice) => sum + invoice.total, 0);
  const paid = filtered.reduce((sum, invoice) => sum + invoice.paid, 0);
  const completedInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const incompletedInvoices = invoices.filter((invoice) => invoice.status !== "paid").length;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleInvoices = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function savePayment(payment: InvoicePayment, convertedAmount: number) {
    if (!paymentInvoice) return;
    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== paymentInvoice.id) return invoice;
        const nextPaid = Math.min(invoice.total, invoice.paid + convertedAmount);
        const nextStatus: PaymentStatus =
          nextPaid >= invoice.total ? "paid" : nextPaid > 0 ? "partial" : "unpaid";
        return {
          ...invoice,
          paid: nextPaid,
          status: nextStatus,
          paymentMethod: payment.method,
          payments: [payment, ...invoice.payments],
        };
      }),
    );
    setViewingInvoice((current) =>
      current?.id === paymentInvoice.id
        ? {
            ...current,
            paid: Math.min(current.total, current.paid + convertedAmount),
            status:
              Math.min(current.total, current.paid + convertedAmount) >= current.total
                ? "paid"
                : "partial",
            paymentMethod: payment.method,
            payments: [payment, ...current.payments],
          }
        : current,
    );
    toast.success("تم حفظ الدفعة", `تم تسجيل دفعة على الفاتورة ${paymentInvoice.id} بنجاح.`);
  }

  function saveInvoice(nextInvoice: Invoice) {
    const exists = invoices.some((invoice) => invoice.id === nextInvoice.id);
    setInvoices((current) =>
      current.some((invoice) => invoice.id === nextInvoice.id)
        ? current.map((invoice) => (invoice.id === nextInvoice.id ? nextInvoice : invoice))
        : [nextInvoice, ...current],
    );
    setViewingInvoice((current) => (current?.id === nextInvoice.id ? nextInvoice : current));
    setPaymentInvoice((current) => (current?.id === nextInvoice.id ? nextInvoice : current));
    toast.success(
      exists ? "تم تعديل الفاتورة" : "تم إنشاء الفاتورة",
      exists ? `تم حفظ تعديلات الفاتورة ${nextInvoice.id}.` : `تم إنشاء الفاتورة ${nextInvoice.id} بنجاح.`,
    );
  }

  function returnInvoice(invoiceToReturn: Invoice) {
    const returnedInvoice = { ...invoiceToReturn, returned: true };
    setInvoices((current) =>
      current.map((invoice) => (invoice.id === returnedInvoice.id ? returnedInvoice : invoice)),
    );
    setViewingInvoice(returnedInvoice);
    setPaymentInvoice((current) => (current?.id === returnedInvoice.id ? returnedInvoice : current));
    toast.success("تم إرجاع الفاتورة", `تم تسجيل إرجاع الفاتورة ${returnedInvoice.id}.`);
  }

  useEffect(() => {
    writeStoredList(INVOICES_STORAGE_KEY, invoices);
  }, [invoices]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الفواتير"
        subtitle="مراجعة الفواتير المرتبطة بالطلبات، الدفعات، المتبقي، وتجهيز الطباعة."
      />
      {showDateFilter ? (
        <DateFilterModal
          filter={dateFilter}
          onApply={(filter) => {
            setDateFilter(filter);
            setPage(1);
          }}
          onClose={() => setShowDateFilter(false)}
        />
      ) : null}
      {viewingInvoice ? (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          order={ORDERS.find((order) => order.id === viewingInvoice.orderId)}
          onClose={() => setViewingInvoice(null)}
          onAddPayment={() => setPaymentInvoice(viewingInvoice)}
          onReturnInvoice={returnInvoice}
        />
      ) : null}
      {editingInvoice ? (
        <InvoiceFormModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={saveInvoice}
        />
      ) : null}
      {paymentInvoice ? (
        <AddPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={savePayment}
        />
      ) : null}
      <KpiCards
        cards={[
          { label: "عدد الفواتير المكتملة", value: String(completedInvoices), icon: "file" },
          { label: "عدد الفواتير غير المكتملة", value: String(incompletedInvoices), icon: "alert", tone: "gold" },
          { label: "المدفوع", value: formatMoney(paid), icon: "wallet", tone: "success" },
          { label: "المتبقي", value: formatMoney(total - paid), icon: "clock", tone: "gold" },
        ]}
      />
      <FilterCard className="lg:grid-cols-[minmax(320px,2fr)_repeat(4,minmax(120px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الفاتورة أو هاتف العميل"
          aria-label="بحث الفواتير"
        />
        <Select value={type} onChange={(event) => { setType(event.target.value as InvoiceType | "all"); setPage(1); }}>
          <option value="all">كل الفواتير</option>
          <option value="external">فواتير خارجية</option>
          <option value="internal">فواتير داخلية</option>
        </Select>
        <Select value={currency} onChange={(event) => { setCurrency(event.target.value as Currency | "all"); setPage(1); }}>
          <option value="all">كل العملات</option>
          <option value="SYP">ليرة سورية</option>
          <option value="USD">دولار</option>
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value as PaymentStatus | "all"); setPage(1); }}>
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوعة بالكامل</option>
          <option value="partial">مدفوعة جزئياً</option>
        </Select>
        <Select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as PaymentMethod | "all"); setPage(1); }}>
          <option value="all">كل طرق الدفع</option>
          <option value="cash">كاش</option>
          <option value="sham-cash">شام كاش</option>
        </Select>
        <Button
          type="button"
          variant={hasDateFilter ? "primary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => setShowDateFilter(true)}
        >
          <Icon name="clock" size={18} />
          الفترة الزمنية
        </Button>
      </FilterCard>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1020px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["رقم الفاتورة", "الطلب", "العميل", "الفني", "النوع", "العملة", "الحالة", "الإجمالي", "المتبقي", "إجراءات"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold">{invoice.id}</td>
                  <td className="px-4 py-4 text-content-muted">{invoice.orderId}</td>
                  <td className="px-4 py-4 text-content">
                    <div className="font-medium">{invoice.client}</div>
                    <div className="text-xs text-content-muted" dir="ltr">
                      {invoice.clientPhone}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-content-muted">{invoice.technician}</td>
                  <td className="px-4 py-4">
                    <Badge tone="neutral">{typeLabel(invoice.type)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={invoice.currency === "SYP" ? "gold" : "info"}>
                      {currencyLabel(invoice.currency)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={PAYMENT_TONE[invoice.status]} dot>
                      {PAYMENT_LABELS[invoice.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-content-muted">
                    {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${invoice.id}`}
                        title="تفاصيل الفاتورة"
                        onClick={() => setViewingInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`تعديل ${invoice.id}`}
                        title="تعديل الفاتورة"
                        onClick={() => setEditingInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="pencil" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="فاتورة"
        />
      </Card>
    </div>
  );
}
