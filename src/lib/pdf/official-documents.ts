import { readFile } from "node:fs/promises";
import path from "node:path";
import { launchPdfBrowser } from "@/lib/pdf/launch-browser";
import { API_BASE_URL } from "@/config/api-endpoints";
import type { Invoice } from "@/features/operations/types";
import {
  convertPaymentToInvoiceCurrency,
  invoicePartTotal,
  remaining,
} from "@/features/operations/utils/invoice";
import { formatMoney } from "@/lib/format/currency";
import { localDisplayDateTime } from "@/lib/format/date";
import {
  INVOICE_FOOTER_CSS,
  invoiceTerms,
  invoiceTermsHtml,
  invoiceWarrantyHtml,
} from "@/lib/pdf/invoice-footer";
import type { RepairRequest } from "@/models/requests/request.model";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "@/models/requests/request.model";
import type { Settings } from "@/models/settings/settings.model";

const BRAND_NAME = "AL-KHUBARA COMPANY";
const BRAND_SUBTITLE = "Maintenance Center";
const FALLBACK_EMAIL = "support@golden-control.com";
const FALLBACK_PHONE = "+966 50 123 4567";
const FALLBACK_ADDRESS = "دمشق";
const GOLD = "#8a6800";
const GOLD_LIGHT = "#b98b2f";
const DARK = "#1f1f1f";
const MUTED = "#70685f";
const BORDER = "#dfd3bf";
const SOFT = "#f8f3ea";

type DocumentBrand = {
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  terms: string[];
  logoDataUri: string;
};

function text(value: unknown, fallback = "غير محدد") {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function escapeHtml(value: unknown) {
  return text(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortText(value: unknown, max = 90) {
  const next = text(value, "");
  return next.length > max ? `${next.slice(0, max - 1)}…` : next;
}

function displayDateTime(value: string) {
  return localDisplayDateTime(value, "غير محدد");
}

function topIcon(name: "mail" | "phone" | "location") {
  const paths = {
    mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M7 4h10v16H7z"/><path d="M11 17h2"/>',
    location: '<path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/>',
  };

  return `<svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function mimeFromPath(value?: string | null) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

async function localAssetDataUri(fileName: string) {
  const filePath = path.join(process.cwd(), "public", "brand", fileName);
  const buffer = await readFile(filePath);
  return `data:${mimeFromPath(fileName)};base64,${buffer.toString("base64")}`;
}

async function remoteAssetDataUri(url: string) {
  // Some hosts reject/hang on requests with no User-Agent (bot filtering on
  // static-asset hosts/CDNs), which a real browser always sends but Node's
  // server-side fetch (used here by Puppeteer) does not by default — this is
  // the concrete reason the uploaded logo could load fine in the browser-print
  // path yet fail only in the server-rendered PDF. A hanging fetch also must
  // not stall PDF generation past the client's download timeout, so it still
  // falls back to the bundled logo instead.
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GoldenControlPdfRenderer/1.0)",
      Accept: "image/*",
    },
  });
  if (!response.ok) throw new Error(`Logo fetch failed with status ${response.status}`);
  const mime = response.headers.get("content-type") ?? mimeFromPath(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function logoDataUri(settings?: Settings | null) {
  const settingsLogoUrl = mediaUrl(settings?.logoPath);
  if (settingsLogoUrl) {
    try {
      return await remoteAssetDataUri(settingsLogoUrl);
    } catch (error) {
      // Keep documents printable even if the uploaded logo is temporarily
      // unavailable, but log it — silently swapping in the generic bundled
      // logo with no trace was the exact reason this bug was hard to diagnose.
      console.error("official-documents: falling back to bundled logo —", error);
    }
  }
  return localAssetDataUri("al-khubara-logo-transparent.png");
}

async function documentBrand(settings?: Settings | null): Promise<DocumentBrand> {
  return {
    address: text(settings?.address, FALLBACK_ADDRESS),
    phone1: text(settings?.phone1, FALLBACK_PHONE),
    phone2: text(settings?.phone2, ""),
    email: text(settings?.email, FALLBACK_EMAIL),
    terms: invoiceTerms(settings),
    logoDataUri: await logoDataUri(settings),
  };
}

function htmlShell(title: string, brand: DocumentBrand, body: string) {
  const phone = [brand.phone1, brand.phone2].filter(Boolean).join("   ");
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: ${DARK};
      background: #ffffff;
      font-family: Arial, Tahoma, "DejaVu Sans", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 9mm 16mm 10mm;
      background: #ffffff;
      direction: rtl;
      position: relative;
    }
    .logo { display: block; width: 45mm; max-height: 42mm; object-fit: contain; margin: 0 auto 4mm; }
    .contact {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6mm;
      align-items: center;
      color: #3c3934;
      font-size: 10px;
      margin-top: 0;
      direction: ltr;
      text-align: center;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 1.5mm;
      direction: rtl;
      white-space: nowrap;
    }
    .contact-icon {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: ${GOLD};
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      flex: 0 0 auto;
    }
    .contact .rtl { direction: rtl; }
    .gold-line { height: 1.2px; background: ${GOLD_LIGHT}; margin: 5mm 0 3mm; }
    .thin-line { height: 1px; background: ${BORDER}; margin-bottom: 7mm; }
    .panel {
      border: 1px solid ${BORDER};
      border-radius: 6px;
      background: #fffdfa;
      overflow: hidden;
    }
    .panel-title {
      color: ${GOLD};
      font-weight: 800;
      font-size: 15px;
      padding-bottom: 3mm;
      border-bottom: 1px solid ${BORDER};
      margin-bottom: 3mm;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; }
    .details { padding: 5mm; min-height: 35mm; }
    .row {
      display: flex;
      align-items: baseline;
      gap: 2mm;
      min-height: 6.8mm;
      font-size: 12px;
    }
    .label { color: ${MUTED}; white-space: nowrap; flex: 0 0 auto; }
    .value { font-weight: 700; overflow-wrap: anywhere; min-width: 0; }
    .ltr { direction: ltr; unicode-bidi: isolate; text-align: left; }
    .phone-number { direction: ltr; unicode-bidi: isolate; text-align: right; }
    .center { text-align: center; }
    .table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      margin-top: 7mm;
      border: 1px solid ${BORDER};
      border-radius: 6px;
      overflow: hidden;
      font-size: 12px;
    }
    th {
      background: ${GOLD};
      color: #ffffff;
      padding: 3mm 3mm;
      font-weight: 800;
      text-align: center;
    }
    td {
      padding: 3mm 3mm;
      border-top: 1px solid ${BORDER};
      text-align: center;
      vertical-align: middle;
      overflow-wrap: anywhere;
    }
    tbody tr:nth-child(even) td { background: #fffdfa; }
    .right { text-align: right; }
    .summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; margin-top: 8mm; align-items: start; }
    .totals {
      background: #202020;
      color: #ffffff;
      border-radius: 7px;
      padding: 5mm;
      min-height: 38mm;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: center;
      border-bottom: 1px solid #4a4a4a;
      padding: 0 0 3.5mm;
      margin-bottom: 3.5mm;
    }
    .totals-label { color: #d9d2c2; font-size: 11px; }
    .totals-amount { font-weight: 900; font-size: 22px; direction: rtl; white-space: nowrap; }
    .remaining {
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: center;
      background: ${GOLD};
      color: #ffffff;
      border-radius: 4px;
      padding: 3mm 5mm;
      font-weight: 800;
    }
    .payments { min-height: 39mm; padding: 5mm; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 3mm; }
    .mini-table th { padding: 2mm; background: ${GOLD}; color: #ffffff; font-weight: 700; text-align: right; border-bottom: 1px solid ${BORDER}; }
    .mini-table td { padding: 3mm 2mm; border-top: 1px solid ${BORDER}; }
    ${INVOICE_FOOTER_CSS}
    .top-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: ${SOFT};
      border: 1px solid ${BORDER};
      border-radius: 4px;
      margin-bottom: 8mm;
      overflow: hidden;
    }
    .top-cell { padding: 5mm 7mm; text-align: center; border-inline-start: 1px solid ${BORDER}; }
    .top-cell:last-child { border-inline-start: 0; }
    .top-label { display: block; color: ${MUTED}; font-size: 14px; margin-bottom: 2mm; }
    .top-value { color: ${GOLD}; font-weight: 800; font-size: 13px; }
    .request-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
      margin-bottom: 7mm;
    }
    .request-col {
      border-inline-end: 2px solid ${GOLD_LIGHT};
      padding-inline-end: 6mm;
      min-height: 48mm;
    }
    .request-col h2 {
      font-size: 15px;
      margin: 0 0 6mm;
      color: ${DARK};
    }
    .notice {
      border: 1px solid ${BORDER};
      border-radius: 6px;
      padding: 6mm;
      margin-top: 8mm;
      background: #fbf4ea;
      min-height: 32mm;
    }
    .notice.white { background: #ffffff; border-style: dashed; }
    .notice h3 { color: ${GOLD}; margin: 0 0 5mm; font-size: 14px; }
    .footer-line { height: 1px; background: ${BORDER}; margin-top: 7mm; }
    .footer {
      position: absolute;
      bottom: 7mm;
      left: 16mm;
      right: 16mm;
      text-align: center;
      color: ${MUTED};
      font-size: 10px;
    }
    /* Non-table sections must never split across two pages: if a section does
       not fit, it moves whole to the next page. Tables (.table/.mini-table)
       are intentionally excluded and keep splitting between pages. */
    .top-strip,
    .request-columns,
    .request-col,
    .grid-2,
    .summary-row,
    .panel,
    .notice,
    .totals,
    .warranty,
    .terms {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <main class="page">
    <img class="logo" src="${brand.logoDataUri}" alt="${BRAND_NAME}" />
    <div class="contact">
      <div class="contact-item">${topIcon("mail")}<span>${escapeHtml(brand.email)}</span></div>
      <div class="contact-item">${topIcon("phone")}<span class="phone-number">${escapeHtml(phone || FALLBACK_PHONE)}</span></div>
      <div class="contact-item rtl">${topIcon("location")}<span>${escapeHtml(brand.address)}</span></div>
    </div>
    <div class="gold-line"></div>
    <div class="thin-line"></div>
    ${body}
    <div class="footer">جميع الحقوق محفوظة © 2026</div>
  </main>
</body>
</html>`;
}

async function renderHtmlToPdf(html: string) {
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function renderInvoicePdf(invoice: Invoice, settings?: Settings | null) {
  const brand = await documentBrand(settings);
  const parts = invoice.parts.slice(0, 6);
  const payments = invoice.payments.slice(0, 4);
  const remainingAmount = remaining(invoice.total, invoice.paid);

  const body = `
    <section class="grid-2">
      <div class="panel details">
        <div class="panel-title">بيانات العميل</div>
        <div class="row"><span class="label">الاسم:</span><span class="value">${escapeHtml(invoice.client)}</span></div>
        <div class="row"><span class="label">الجوال الأساسي:</span><span class="value phone-number">${escapeHtml(invoice.clientPhone)}</span></div>
        <div class="row"><span class="label">العنوان:</span><span class="value">${escapeHtml(invoice.clientAddress)}</span></div>
      </div>
      <div class="panel details">
        <div class="panel-title">تفاصيل الفاتورة</div>
        <div class="row"><span class="label">رقم الفاتورة:</span><span class="value ltr">${escapeHtml(invoice.invoiceNumber || invoice.id)}</span></div>
        <div class="row"><span class="label">رقم الطلب:</span><span class="value ltr">${escapeHtml(invoice.requestNumber || invoice.orderId)}</span></div>
        <div class="row"><span class="label">وقت الإنشاء:</span><span class="value ltr">${escapeHtml(displayDateTime(invoice.issuedAt))}</span></div>
      </div>
    </section>

    <table class="table">
      <thead>
        <tr>
          <th class="right" style="width: 48%">اسم القطعة</th>
          <th style="width: 13%">الكمية</th>
          <th style="width: 19%">سعر الوحدة</th>
          <th style="width: 20%">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${parts.length > 0
          ? parts.map((part) => `
            <tr>
              <td class="right">${escapeHtml(shortText(part.name, 58))}</td>
              <td class="ltr center">${escapeHtml(part.quantity)}</td>
              <td>${escapeHtml(formatMoney(part.unitPrice, invoice.currency))}</td>
              <td><strong>${escapeHtml(formatMoney(invoicePartTotal(part), invoice.currency))}</strong></td>
            </tr>
          `).join("")
          : `<tr><td colspan="4">لا توجد قطع مسجلة على هذه الفاتورة.</td></tr>`}
      </tbody>
    </table>

    <section class="summary-row">
      <div>
        <div class="totals">
          <div class="totals-line">
            <span class="totals-label">إجمالي الفاتورة</span>
            <strong class="totals-amount">${escapeHtml(formatMoney(invoice.total, invoice.currency))}</strong>
          </div>
          <div class="totals-line">
            <span class="totals-label">المبلغ المدفوع</span>
            <strong>${escapeHtml(formatMoney(invoice.paid, invoice.currency))}</strong>
          </div>
          <div class="remaining">
            <span>المتبقي للسداد</span>
            <strong>${escapeHtml(formatMoney(remainingAmount, invoice.currency))}</strong>
          </div>
        </div>
        ${invoiceWarrantyHtml(invoice.warrantyDuration)}
      </div>
      <div>
        <div class="panel payments">
          <div class="panel-title">سجل الدفعات المستلمة</div>
          <table class="mini-table">
            <thead>
              <tr>
                <th>المبلغ المدفوع</th>
                <th>المبلغ بعد التحويل</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length > 0
                ? payments.map((payment) => `
                  <tr>
                    <td>${escapeHtml(formatMoney(payment.amount, payment.currency))}</td>
                    <td><strong>${escapeHtml(
                      formatMoney(
                        payment.convertedAmount ??
                          convertPaymentToInvoiceCurrency(payment.amount, payment.currency, invoice.currency),
                        invoice.currency,
                      ),
                    )}</strong></td>
                  </tr>
                `).join("")
                : `<tr><td colspan="2">لا توجد دفعات مسجلة.</td></tr>`}
            </tbody>
          </table>
        </div>
        ${invoiceTermsHtml(brand.terms)}
      </div>
    </section>
    <div class="footer-line"></div>
  `;

  return renderHtmlToPdf(htmlShell(`invoice-${invoice.invoiceNumber || invoice.id}`, brand, body));
}

export async function renderRequestPdf(request: RepairRequest, settings?: Settings | null) {
  const brand = await documentBrand(settings);
  const devices = request.devices.slice(0, 6);
  const printedAt = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Amman",
  }).format(new Date());

  const body = `
    <section class="top-strip">
      <div class="top-cell">
        <span class="top-label">رقم الطلب</span>
        <span class="top-value ltr">#${escapeHtml(request.requestNumber)}</span>
      </div>
      <div class="top-cell">
        <span class="top-label">وقت الإنشاء</span>
        <strong class="ltr">${escapeHtml(displayDateTime(request.createdAt))}</strong>
      </div>
    </section>

    <section class="request-columns">
      <div class="request-col">
        <h2>بيانات المسؤول</h2>
        <div class="row"><span class="label">الموظف المسؤول:</span><span class="value">${escapeHtml(text(request.technicianName))}</span></div>
        <div class="row"><span class="label">نوع الطلب:</span><span class="value" style="color:${GOLD}">${escapeHtml(REQUEST_TYPE_LABELS[request.type])}</span></div>
      </div>
      <div class="request-col">
        <h2>بيانات العميل</h2>
        <div class="row"><span class="label">اسم العميل:</span><span class="value">${escapeHtml(request.customer.name)}</span></div>
        <div class="row"><span class="label">الجوال الأساسي:</span><span class="value phone-number">${escapeHtml(request.customer.firstPhone)}</span></div>
        <div class="row"><span class="label">العنوان:</span><span class="value">${escapeHtml(shortText(request.customer.address, 58))}</span></div>
      </div>
    </section>

    <h2 style="font-size:14px; margin:0 0 3mm;">الأجهزة المشمولة بالطلب</h2>
    <table class="table" style="margin-top:0">
      <thead>
        <tr>
          <th style="width: 8%">#</th>
          <th style="width: 21%">نوع الجهاز</th>
          <th style="width: 28%">اسم الجهاز</th>
          <th style="width: 22%">العلامة التجارية</th>
          <th style="width: 21%">الموديل</th>
        </tr>
      </thead>
      <tbody>
        ${devices.length > 0
          ? devices.map((device, index) => `
            <tr>
              <td class="ltr">${index + 1}</td>
              <td>${escapeHtml(shortText(device.deviceType, 24))}</td>
              <td>${escapeHtml(shortText(device.deviceName, 34))}</td>
              <td>${escapeHtml(shortText(device.brand, 24))}</td>
              <td class="ltr">${escapeHtml(shortText(device.model, 26))}</td>
            </tr>
          `).join("")
          : `<tr><td colspan="5">لا توجد أجهزة مسجلة على هذا الطلب.</td></tr>`}
      </tbody>
    </table>

    <section class="notice">
      <h3>وصف العطل</h3>
      <div>${escapeHtml(shortText(request.faultDescription, 150))}</div>
    </section>
    <section class="notice white">
      <h3>ملاحظات إضافية</h3>
      <div>${escapeHtml(shortText(request.notes, 150))}</div>
    </section>
    <section class="notice" style="min-height:24mm; margin-top:8mm;">
      <h3>الشروط والأحكام العامة:</h3>
      <div>حالة الطلب: ${escapeHtml(REQUEST_STATUS_LABELS[request.status])} - هذا المستند تأكيد لاستلام بيانات الطلب وليس تأكيداً نهائياً للإصلاح.</div>
    </section>
    <div class="ltr" style="position:absolute; bottom:12mm; left:16mm; color:${MUTED}; font-size:10px;">Printed at ${escapeHtml(printedAt)}</div>
  `;

  return renderHtmlToPdf(htmlShell(`request-${request.requestNumber}`, brand, body));
}
