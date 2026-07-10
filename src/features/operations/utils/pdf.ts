import type { Order, Invoice } from "../types";
import { API_BASE_URL } from "@/config/api-endpoints";
import { settingsService } from "@/services/settings.service";
import { formatMoney } from "@/lib/format/currency";
import { localDisplayDateTime } from "@/lib/format/date";
import { PAYMENT_METHOD_LABELS } from "../constants";
import { invoicePartTotal, remaining } from "./invoice";
import {
  INVOICE_FOOTER_CSS,
  invoiceTerms,
  invoiceTermsHtml,
  invoiceWarrantyHtml,
} from "@/lib/pdf/invoice-footer";

export function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function buildSimplePdf(order: Order): Blob {
  const lines = [
    "Golden Control - Maintenance Order",
    `Order: ${order.id}`,
    `Client: ${escapePdfText(order.client)}`,
    `Phone: ${order.phone}`,
    `Device: ${escapePdfText(order.device)}`,
    `Brand: ${escapePdfText(order.brand)}`,
    `Technician: ${escapePdfText(order.technician)}`,
    `Visit: ${order.visitDate}`,
    `Priority: ${order.priority}`,
  ];

  const content = [
    "BT",
    "/F1 18 Tf",
    "50 780 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 12 Tf",
    ...lines.slice(1).map((line) => `0 -28 Td (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadOrderPdf(order: Order) {
  const url = URL.createObjectURL(buildSimplePdf(order));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printOrderPdf(order: Order) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
          h1 { color: #8a6b2f; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td { border: 1px solid #e7dfcf; padding: 12px; }
          td:first-child { width: 180px; font-weight: 700; background: #f6f1e7; }
        </style>
      </head>
      <body>
        <h1>طلب صيانة ${order.id}</h1>
        <table>
          <tr><td>العميل</td><td>${order.client}</td></tr>
          <tr><td>الهاتف</td><td dir="ltr">${order.phone}</td></tr>
          <tr><td>الجهاز</td><td>${order.device}</td></tr>
          <tr><td>الماركة</td><td>${order.brand}</td></tr>
          <tr><td>الفني</td><td>${order.technician}</td></tr>
          <tr><td>موعد الزيارة</td><td>${order.visitDate}</td></tr>
          <tr><td>العنوان</td><td>${order.address}</td></tr>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type PrintBrand = {
  logoUrl: string;
  centerName: string;
  secondaryName: string;
  email: string;
  phone: string;
  address: string;
  terms: string[];
};

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function contactIcon(name: "mail" | "phone" | "location") {
  const paths = {
    mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M7 4h10v16H7z"/><path d="M11 17h2"/>',
    location: '<path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/>',
  };

  return `<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

async function getPrintBrand(): Promise<PrintBrand> {
  const fallback: PrintBrand = {
    logoUrl: "/brand/al-khubara-logo-transparent.png",
    centerName: "AL-KHUBARA COMPANY",
    secondaryName: "Maintenance Center",
    email: "support@golden-control.com",
    phone: "+966 50 123 4567",
    address: "دمشق",
    terms: invoiceTerms(null),
  };

  try {
    // Authenticated settings fetch (same source the settings screen uses), so
    // the printed copy and the PDF both show the terms saved in the settings.
    const data = await settingsService.get();
    return {
      logoUrl: mediaUrl(data.logoPath) ?? fallback.logoUrl,
      centerName: data.centerName || fallback.centerName,
      secondaryName: data.secondaryName || fallback.secondaryName,
      email: data.email || fallback.email,
      phone: [data.phone1, data.phone2].filter(Boolean).join("   ") || fallback.phone,
      address: data.address || fallback.address,
      terms: invoiceTerms(data),
    };
  } catch {
    return fallback;
  }
}

// Single source of truth for the invoice document. Both "طباعة الفاتورة" and
// "تحميل الفاتورة (PDF)" render this exact template so their output — including
// the spare-part name — is identical.
async function openInvoiceDocument(invoice: Invoice) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  const brand = await getPrintBrand();

  const partsRows = invoice.parts
    .map(
      (part) => `
        <tr>
          <td>${escapeHtml(part.name)}</td>
          <td>${part.quantity}</td>
          <td>${formatMoney(part.unitPrice, invoice.currency)}</td>
          <td><strong>${formatMoney(invoicePartTotal(part), invoice.currency)}</strong></td>
        </tr>
      `,
    )
    .join("");
  const paymentsRows = invoice.payments
    .map(
      (payment) => `
        <tr>
          <td><strong>${formatMoney(payment.convertedAmount ?? payment.amount, invoice.currency)}</strong></td>
          <td>${PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</td>
          <td dir="ltr">${escapeHtml(localDisplayDateTime(payment.paidAt, "غير محدد"))}</td>
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${escapeHtml(invoice.invoiceNumber || invoice.id)}</title>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #eee; color: #202020; font-family: Arial, Tahoma, sans-serif; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 14mm; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #b98b2f; padding-bottom: 16px; }
          .logo { width: 150px; max-height: 120px; margin: 0 auto 10px; display: block; object-fit: contain; }
          h1 { margin: 0; color: #8a6800; font-size: 28px; }
          .sub { margin-top: 6px; color: #70675b; font-size: 13px; }
          .contact { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; color: #333; font-size: 12px; direction: ltr; }
          .contact-item { display: inline-flex; align-items: center; justify-content: center; gap: 6px; direction: rtl; white-space: nowrap; }
          .contact-icon { width: 13px; height: 13px; fill: none; stroke: #8a6800; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }
          .phone-number { direction: ltr; unicode-bidi: isolate; text-align: right; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
          .box { border: 1px solid #dfd3bf; background: #fbf8f2; border-radius: 8px; padding: 14px; min-height: 118px; }
          .box h2 { margin: 0 0 12px; padding-bottom: 9px; border-bottom: 1px solid #dfd3bf; color: #8a6800; font-size: 17px; }
          .row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; font-size: 13px; }
          .label { color: #70675b; }
          .value { font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; overflow: hidden; border-radius: 8px; }
          th { background: #8a6800; color: white; padding: 11px; font-size: 13px; }
          td { border: 1px solid #eadfcd; padding: 10px; font-size: 12px; text-align: right; }
          .summary { margin-top: 24px; display: grid; grid-template-columns: 0.82fr 1fr; gap: 20px; align-items: start; }
          .totals { background: #202020; color: white; border-radius: 8px; padding: 18px; }
          .totals .line { display: flex; justify-content: space-between; border-bottom: 1px solid #484848; padding: 11px 0; }
          .remaining { margin-top: 13px; display: flex; justify-content: space-between; background: #8a6800; padding: 13px; border-radius: 6px; font-weight: 700; }
          .payments { border: 1px solid #dfd3bf; border-radius: 8px; padding: 12px; }
          ${INVOICE_FOOTER_CSS}
          .footer { margin-top: 34px; padding-top: 18px; border-top: 1px solid #dfd3bf; text-align: center; color: #81786d; font-size: 11px; }
        </style>
      </head>
      <body>
        <main class="page">
        <section class="header">
          <img class="logo" src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.centerName)}" />
          <h1>${escapeHtml(brand.centerName)}</h1>
          <div class="sub">${escapeHtml(brand.secondaryName)}</div>
          <div class="contact">
            <span class="contact-item">${contactIcon("mail")}<span>${escapeHtml(brand.email)}</span></span>
            <span class="contact-item">${contactIcon("phone")}<span class="phone-number">${escapeHtml(brand.phone)}</span></span>
            <span class="contact-item">${contactIcon("location")}<span>${escapeHtml(brand.address)}</span></span>
          </div>
        </section>
        <div class="grid">
          <section class="box">
            <h2>بيانات العميل</h2>
            <div class="row"><span class="label">الاسم:</span><span class="value">${escapeHtml(invoice.client)}</span></div>
            <div class="row"><span class="label">الجوال الأساسي:</span><span class="value phone-number">${escapeHtml(invoice.clientPhone)}</span></div>
            <div class="row"><span class="label">العنوان:</span><span class="value">${escapeHtml(invoice.clientAddress)}</span></div>
          </section>
          <section class="box">
            <h2>تفاصيل الفاتورة</h2>
            <div class="row"><span class="label">رقم الفاتورة:</span><span class="value" dir="ltr">${escapeHtml(invoice.invoiceNumber || invoice.id)}</span></div>
            <div class="row"><span class="label">رقم الطلب:</span><span class="value" dir="ltr">${escapeHtml(invoice.requestNumber || invoice.orderId)}</span></div>
            <div class="row"><span class="label">وقت الإنشاء:</span><span class="value" dir="ltr">${escapeHtml(localDisplayDateTime(invoice.issuedAt, "غير محدد"))}</span></div>
          </section>
        </div>
        <table>
          <thead><tr><th>القطعة</th><th>الكمية</th><th>سعر القطعة</th><th>الإجمالي</th></tr></thead>
          <tbody>${partsRows || `<tr><td colspan="4">لا توجد قطع مسجلة.</td></tr>`}</tbody>
        </table>
        <section class="summary">
          <div>
            <div class="totals">
              <div class="line"><span>إجمالي الفاتورة</span><strong>${formatMoney(invoice.total, invoice.currency)}</strong></div>
              <div class="line"><span>المبلغ المدفوع</span><strong>${formatMoney(invoice.paid, invoice.currency)}</strong></div>
              <div class="remaining"><span>المتبقي للسداد</span><strong>${formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}</strong></div>
            </div>
            ${invoiceWarrantyHtml(invoice.warrantyDuration)}
          </div>
          <div>
            <div class="payments">
              <strong>سجل الدفعات المستلمة</strong>
              <table>
                <thead><tr><th>المبلغ</th><th>الوسيلة</th><th>وقت الإنشاء</th></tr></thead>
                <tbody>${paymentsRows || `<tr><td colspan="3">لا توجد دفعات.</td></tr>`}</tbody>
              </table>
            </div>
            ${invoiceTermsHtml(brand.terms)}
          </div>
        </section>
        <footer class="footer">جميع الحقوق محفوظة © 2026</footer>
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export async function printInvoice(invoice: Invoice) {
  return openInvoiceDocument(invoice);
}
