"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkeletonRow } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/lib/icons";
import { formatMoney, type Currency } from "@/lib/format/currency";
import { PAGE_SIZE } from "@/config/constants";
import type { Invoice, InvoicePayment, InvoiceType, PaymentStatus, PaymentMethod, DateFilter } from "../../types";
import {
  PAYMENT_TONE,
  PAYMENT_LABELS,
} from "../../constants";
import { getApiErrorMessage } from "@/helpers/api.helper";
import { isUuid } from "@/models/invoices/invoice.model";
import {
  useInvoiceMutations,
  useInvoicePaymentsQuery,
  useInvoiceQuery,
  useInvoicesAllQuery,
  useInvoicesQuery,
} from "@/features/invoices/hooks/use-invoices";
import { useDollarExchangeRate } from "@/features/settings/hooks/use-settings";
import { useRole } from "@/features/auth/hooks/use-role";
import { ConfirmToast } from "@/components/ui/ConfirmToast";
import { useInventoryAllPartsQuery } from "@/features/inventory/hooks/use-inventory";
import { typeLabel, currencyLabel, remaining } from "../../utils/invoice";
import { SectionTitle } from "../shared/SectionTitle";
import { KpiCards } from "../shared/KpiCards";
import { FilterCard } from "../shared/FilterCard";
import { DateFilterModal } from "../shared/DateFilterModal";
import { EmptyState } from "../shared/EmptyState";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { AddPaymentModal } from "./AddPaymentModal";

const EMPTY_INVOICES: Invoice[] = [];

function invoiceTypeFromParam(value: string | null): InvoiceType | "all" {
  return value === "internal" || value === "external" ? value : "all";
}

function invoiceCurrencyFromParam(value: string | null): Currency | "all" {
  const normalized = value?.toUpperCase();
  return normalized === "SYP" || normalized === "USD" ? normalized : "all";
}

function invoiceDisplayNumber(invoice: Invoice) {
  return invoice.invoiceNumber || invoice.id;
}

export function InvoicesScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const typeParam = params.get("type");
  const currencyParam = params.get("currency");
  const [type, setType] = useState<InvoiceType | "all">(() => invoiceTypeFromParam(typeParam));
  const [currency, setCurrency] = useState<Currency | "all">(() => invoiceCurrencyFromParam(currencyParam));
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ from: "", to: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const { recordPayment, refund } = useInvoiceMutations();
  const { role } = useRole();
  const isAdmin = role === "admin";
  const dollarExchangeRate = useDollarExchangeRate();
  const queryIsRequestId = isUuid(query);
  const baseListParams = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
      requestId: queryIsRequestId ? query.trim() : undefined,
      search: !queryIsRequestId ? query : undefined,
      type,
      status,
      currency,
      paymentMethod,
      startDate: dateFilter.from,
      endDate: dateFilter.to,
    }),
    [currency, dateFilter.from, dateFilter.to, paymentMethod, query, queryIsRequestId, status, type],
  );
  const listParams = useMemo(
    () => ({
      ...baseListParams,
      page,
    }),
    [baseListParams, page],
  );
  const activeListQuery = useInvoicesQuery(listParams);
  const invoices = activeListQuery.data?.items ?? EMPTY_INVOICES;
  // KPI cards must reflect every invoice matching the active filters (including
  // refunded ones, and any page beyond the one currently shown), not just the
  // single page rendered in the table below.
  const kpiInvoicesQuery = useInvoicesAllQuery(baseListParams);
  const kpiInvoices = kpiInvoicesQuery.data ?? EMPTY_INVOICES;
  const detailQuery = useInvoiceQuery(viewingInvoice?.id ?? null);
  const paymentsQuery = useInvoicePaymentsQuery(viewingInvoice?.id ?? null);
  const activeViewingInvoice = detailQuery.data ?? viewingInvoice;
  const partsQuery = useInventoryAllPartsQuery();
  const partNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const part of partsQuery.data ?? []) map.set(part.id, part.name);
    return map;
  }, [partsQuery.data]);
  const activeViewingInvoiceWithPayments = activeViewingInvoice
    ? {
        ...activeViewingInvoice,
        payments: paymentsQuery.data ?? activeViewingInvoice.payments,
        // The backend returns `sparePartName` as null (the name is not sent on
        // create), so resolve the real name from the spare-part inventory. This
        // feeds the on-screen table, the printed invoice and the PDF alike.
        parts: activeViewingInvoice.parts.map((part) => ({
          ...part,
          name: (part.sparePartId ? partNameById.get(part.sparePartId) : undefined) || part.name,
        })),
      }
    : null;

  useEffect(() => {
    setType(invoiceTypeFromParam(typeParam));
    setCurrency(invoiceCurrencyFromParam(currencyParam));
    setPage(1);
  }, [currencyParam, typeParam]);

  const total = kpiInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paid = kpiInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const completedInvoices = kpiInvoices.filter((invoice) => invoice.status === "paid").length;
  const incompletedInvoices = kpiInvoices.filter((invoice) => invoice.status !== "paid").length;
  // The invoices list is already filtered to a single currency via the API
  // when the user picks one, so the cards can display it directly.
  const cardsCurrency = currency === "all" ? undefined : currency;
  const hasDateFilter = Boolean(dateFilter.from || dateFilter.to);
  const currentPage = activeListQuery.data?.page ?? page;
  const visibleInvoices = invoices;
  const tableTotal = activeListQuery.data?.total ?? 0;

  function confirmRefund() {
    if (!refundInvoice) return;
    const displayNumber = invoiceDisplayNumber(refundInvoice);
    refund.mutate(refundInvoice.id, {
      onSuccess: () => {
        setRefundInvoice(null);
        toast.success("تم إرجاع الفاتورة", `تم إرجاع الفاتورة ${displayNumber} بنجاح.`);
      },
      onError: (error) => toast.error("تعذر إرجاع الفاتورة", getApiErrorMessage(error)),
    });
  }

  function savePayment(payment: InvoicePayment, convertedAmount: number) {
    if (!paymentInvoice) return;
    void convertedAmount;
    recordPayment.mutate(
      {
        invoiceId: paymentInvoice.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.method,
      },
      {
        onSuccess: () => {
          setPaymentInvoice(null);
          toast.success("تم حفظ الدفعة", `تم تسجيل دفعة على الفاتورة ${invoiceDisplayNumber(paymentInvoice)} بنجاح.`);
        },
        onError: (error) => toast.error("تعذر حفظ الدفعة", getApiErrorMessage(error)),
      },
    );
  }

  useEffect(() => {
    if (activeListQuery.isError && activeListQuery.error) {
      toast.error("تعذر تحميل الفواتير", getApiErrorMessage(activeListQuery.error));
    }
  }, [activeListQuery.error, activeListQuery.isError, toast]);

  useEffect(() => {
    if (kpiInvoicesQuery.isError && kpiInvoicesQuery.error) {
      toast.error("تعذر تحميل إجماليات الفواتير", getApiErrorMessage(kpiInvoicesQuery.error));
    }
  }, [kpiInvoicesQuery.error, kpiInvoicesQuery.isError, toast]);

  function refreshList() {
    void activeListQuery.refetch();
  }

  function updateInvoiceUrl(next: {
    type?: InvoiceType | "all";
    currency?: Currency | "all";
  }) {
    const searchParams = new URLSearchParams(params.toString());
    const nextType = next.type ?? type;
    const nextCurrency = next.currency ?? currency;

    if (nextType === "all") searchParams.delete("type");
    else searchParams.set("type", nextType);

    if (nextCurrency === "all") searchParams.delete("currency");
    else searchParams.set("currency", nextCurrency.toLowerCase());

    const queryString = searchParams.toString();
    router.replace(queryString ? `/invoices?${queryString}` : "/invoices");
  }

  function canAddPayment(invoice: Invoice) {
    return invoice.status !== "paid" && invoice.status !== "refunded" && !invoice.returned;
  }

  function listErrorCard() {
    return (
      <Card className="p-6 text-center text-sm text-danger">
        تعذر تحميل الفواتير.{" "}
        <button type="button" onClick={refreshList} className="underline">
          إعادة المحاولة
        </button>
      </Card>
    );
  }

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
      {activeViewingInvoiceWithPayments ? (
        <InvoiceDetailsModal
          invoice={activeViewingInvoiceWithPayments}
          onClose={() => setViewingInvoice(null)}
          onAddPayment={() => setPaymentInvoice(activeViewingInvoiceWithPayments)}
          onReturnInvoice={isAdmin ? (invoice) => setRefundInvoice(invoice) : undefined}
        />
      ) : null}
      {refundInvoice ? (
        <ConfirmToast
          title="تأكيد إرجاع الفاتورة"
          message={`هل تريد إرجاع الفاتورة ${invoiceDisplayNumber(refundInvoice)}؟`}
          confirmLabel="إرجاع الفاتورة"
          tone="danger"
          isLoading={refund.isPending}
          onCancel={() => setRefundInvoice(null)}
          onConfirm={confirmRefund}
        />
      ) : null}
      {paymentInvoice ? (
        <AddPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={savePayment}
          submitting={recordPayment.isPending}
          submitError={recordPayment.error ? getApiErrorMessage(recordPayment.error) : undefined}
          dollarExchangeRate={dollarExchangeRate}
        />
      ) : null}
      <KpiCards
        cards={[
          { label: "عدد الفواتير المكتملة", value: String(completedInvoices), icon: "file" },
          { label: "عدد الفواتير غير المكتملة", value: String(incompletedInvoices), icon: "alert", tone: "gold" },
          { label: "المدفوع", value: formatMoney(paid, cardsCurrency), icon: "wallet", tone: "success" },
          { label: "المتبقي", value: formatMoney(total - paid, cardsCurrency), icon: "clock", tone: "gold" },
        ]}
      />
      <FilterCard className="lg:grid-cols-[minmax(320px,2fr)_repeat(4,minmax(120px,1fr))_auto]">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الفاتورة، العميل أو الهاتف"
          aria-label="بحث الفواتير"
        />
        <Select
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as InvoiceType | "all";
            setType(nextType);
            setPage(1);
            updateInvoiceUrl({ type: nextType });
          }}
        >
          <option value="all">كل الفواتير</option>
          <option value="external">فواتير خارجية</option>
          <option value="internal">فواتير داخلية</option>
        </Select>
        <Select
          value={currency}
          onChange={(event) => {
            const nextCurrency = event.target.value as Currency | "all";
            setCurrency(nextCurrency);
            setPage(1);
            updateInvoiceUrl({ currency: nextCurrency });
          }}
        >
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
      {activeListQuery.isError ? listErrorCard() : null}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[940px] w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-2 text-content-muted">
                {["رقم الفاتورة", "العميل", "النوع", "العملة", "الحالة", "الإجمالي", "المتبقي", "إجراءات"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {activeListQuery.isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <SkeletonRow key={index} cols={8} />
                ))
              ) : visibleInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-gold-soft">
                  <td className="px-4 py-4 font-bold text-gold" dir="ltr">{invoiceDisplayNumber(invoice)}</td>
                  <td className="max-w-[200px] px-4 py-4 text-content">
                    <span className="max-w-[110px] font-medium">{invoice.client}</span>
                    <span className="mx-2 text-content-muted">-</span>
                    <span className="text-xs text-content-muted" dir="ltr">{invoice.clientPhone}</span>
                  </td>
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
                  <td className="px-4 py-4 text-content-muted" dir="ltr">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-content-muted" dir="ltr">
                    {formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-start gap-2" dir="rtl">
                      <button
                        type="button"
                        aria-label={`تفاصيل ${invoiceDisplayNumber(invoice)}`}
                        title="تفاصيل الفاتورة"
                        onClick={() => setViewingInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label={`دفعة ${invoiceDisplayNumber(invoice)}`}
                        title="إضافة دفعة"
                        disabled={!canAddPayment(invoice)}
                        onClick={() => setPaymentInvoice(invoice)}
                        className="rounded-sm p-1.5 text-content-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="plus" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!activeListQuery.isLoading && visibleInvoices.length === 0 ? (
          <EmptyState title="لا توجد فواتير مطابقة." />
        ) : null}
        <TablePagination
          page={currentPage}
          total={tableTotal}
          pageSize={PAGE_SIZE}
          onPage={setPage}
          itemLabel="فاتورة"
        />
      </Card>
    </div>
  );
}
