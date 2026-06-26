import type { Invoice, InvoicePart, InvoicePayment, Order, PaymentStatus, PaymentCurrency } from "../types";
import type { Currency } from "@/lib/format/currency";
import type { RepairRequest } from "@/models/requests/request.model";
import { USD_TO_SYP_RATE } from "../constants";
import { TECHNICIAN_PHONE_BY_NAME } from "../data/seed";
import { INVOICES } from "../data/seed";

export function typeLabel(type: "external" | "internal"): string {
  return type === "external" ? "خارجي" : "داخلي";
}

export function currencyLabel(currency: Currency): string {
  return currency === "SYP" ? "ليرة سورية" : "دولار";
}

export function invoicePartTotal(part: InvoicePart): number {
  return part.quantity * part.unitPrice;
}

export function invoicePartsTotal(parts: InvoicePart[]): number {
  return parts.reduce((sum, part) => sum + invoicePartTotal(part), 0);
}

export function remaining(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

export function getTechnicianPhone(name: string): string {
  if (!name || name === "غير محدد") return "لا يوجد";
  return TECHNICIAN_PHONE_BY_NAME[name] ?? "لا يوجد";
}

export function nextInvoiceId(invoices: Invoice[]): string {
  const maxNumber = Math.max(0, ...invoices.map((invoice) => Number(invoice.id.replace(/\D/g, "")) || 0));
  return `INV-${maxNumber + 1}`;
}

export function convertPaymentToInvoiceCurrency(
  amount: number,
  paymentCurrency: PaymentCurrency,
  invoiceCurrency: Currency,
): number {
  if (paymentCurrency === invoiceCurrency) return amount;
  if (invoiceCurrency === "SYP") return amount * USD_TO_SYP_RATE;
  return amount / USD_TO_SYP_RATE;
}

export function normalizeInvoice(invoice: Partial<Invoice>): Invoice {
  const total = Number(invoice.total) || 0;
  const paid = Math.min(total, Math.max(0, Number(invoice.paid) || 0));
  const status: PaymentStatus =
    invoice.status === "paid" ||
    invoice.status === "partial" ||
    invoice.status === "unpaid" ||
    invoice.status === "refunded"
      ? invoice.status
      : paid >= total && total > 0
        ? "paid"
        : paid > 0
          ? "partial"
          : "unpaid";
  const currency: Currency = invoice.currency === "USD" ? "USD" : "SYP";
  const paymentMethod = invoice.paymentMethod === "sham-cash" ? "sham-cash" as const : "cash" as const;
  const parts =
    Array.isArray(invoice.parts) && invoice.parts.length > 0
      ? invoice.parts.map((part, index) => ({
          id: part.id || `PRT-${index + 1}`,
          sparePartId: part.sparePartId,
          name: part.name || "قطعة غير محددة",
          quantity: Math.max(1, Number(part.quantity) || 1),
          unitPrice: Math.max(0, Number(part.unitPrice) || 0),
          currency: part.currency,
          totalPrice: Math.max(0, Number(part.totalPrice) || 0),
        }))
      : [
          {
            id: `PRT-${(invoice.id ?? "0000").replace(/\D/g, "").slice(-4) || "0000"}`,
            sparePartId: undefined,
            name: "أجور صيانة",
            quantity: 1,
            unitPrice: total,
            currency,
            totalPrice: total,
          },
        ];
  const technician = invoice.technician || "غير محدد";

  return {
    id: invoice.id || "INV-0000",
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId || "ORD-0000",
    requestNumber: invoice.requestNumber,
    type: invoice.type === "internal" ? "internal" : "external",
    client: invoice.client || "عميل غير محدد",
    clientPhone: invoice.clientPhone || "غير محدد",
    clientPhone2: invoice.clientPhone2 || "لا يوجد",
    clientAddress: invoice.clientAddress || "غير محدد",
    technician,
    technicianPhone: invoice.technicianPhone || getTechnicianPhone(technician),
    status,
    currency,
    paymentMethod,
    total,
    paid,
    issuedAt: invoice.issuedAt || new Date().toISOString().slice(0, 10),
    warrantyDuration: invoice.warrantyDuration || "غير محددة",
    locationURL: invoice.locationURL ?? "",
    centerPullItems: invoice.centerPullItems ?? "",
    notes: invoice.notes ?? "",
    returned: Boolean(invoice.returned),
    parts,
    payments: Array.isArray(invoice.payments)
      ? invoice.payments.map((payment, index) => ({
          id: payment.id || `PAY-${index + 1}`,
          amount: Math.max(0, Number(payment.amount) || 0),
          convertedAmount: Math.max(0, Number(payment.convertedAmount ?? payment.amount) || 0),
          currency: payment.currency === "USD" ? "USD" as const : "SYP" as const,
          method: payment.method === "sham-cash" ? "sham-cash" as const : "cash" as const,
          dollarExchangeRate: Math.max(0, Number(payment.dollarExchangeRate) || 0) || undefined,
          paidAt: payment.paidAt || invoice.issuedAt || new Date().toISOString().slice(0, 10),
        }))
      : [],
  };
}

export function createInvoiceDraftFromOrder(order: Order, invoices: Invoice[]): Invoice {
  const paid = Math.min(order.total, order.paid);
  const status: PaymentStatus = paid >= order.total && order.total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";

  return {
    id: nextInvoiceId(invoices),
    orderId: order.id,
    requestNumber: order.id,
    type: order.type,
    client: order.client,
    clientPhone: order.phone,
    clientPhone2: order.phone2 ?? "",
    clientAddress: order.address,
    technician: order.technician,
    technicianPhone: getTechnicianPhone(order.technician),
    status,
    currency: "SYP",
    paymentMethod: "cash",
    total: order.total,
    paid,
    issuedAt: new Date().toISOString().slice(0, 10),
    warrantyDuration: "",
    locationURL: order.locationUrl ?? "",
    centerPullItems: order.status === "incompleted" ? order.device : "",
    notes: "",
    returned: false,
    parts: [
      {
        id: `PRT-${order.id.replace(/\D/g, "").slice(-4) || "0000"}`,
        name: order.device,
        quantity: 1,
        unitPrice: order.total,
        currency: "SYP",
        totalPrice: order.total,
      },
    ],
    payments:
      paid > 0
        ? [
            {
              id: `PAY-${Date.now().toString().slice(-5)}`,
              amount: paid,
              convertedAmount: paid,
              currency: "SYP",
              method: "cash",
              paidAt: new Date().toISOString().slice(0, 10),
            },
          ]
        : [],
  };
}

export function createInvoiceDraftFromRequest(request: RepairRequest): Invoice {
  const deviceSummary = request.devices
    .map((device) => [device.deviceType, device.deviceName].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("، ");

  return {
    id: `INV-${Date.now().toString().slice(-6)}`,
    orderId: request.id,
    requestNumber: request.requestNumber,
    type: request.type,
    client: request.customer.name,
    clientPhone: request.customer.firstPhone,
    clientPhone2: request.customer.secondPhone,
    clientAddress: request.customer.address,
    technician: request.technicianName || "غير محدد",
    technicianPhone: "",
    status: "partial",
    currency: "SYP",
    paymentMethod: "cash",
    total: 0,
    paid: 0,
    issuedAt: new Date().toISOString().slice(0, 10),
    warrantyDuration: "",
    locationURL: request.customer.locationLink,
    centerPullItems: request.status === "pulltocenter" ? deviceSummary || request.faultDescription : "",
    notes: [request.faultDescription, request.notes].filter(Boolean).join("\n"),
    returned: false,
    parts: [
      {
        id: "",
        sparePartId: "",
        name: "",
        quantity: 1,
        unitPrice: 0,
        currency: "SYP",
      },
    ],
    payments: [],
  };
}
