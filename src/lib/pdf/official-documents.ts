import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { formatMoney } from "@/lib/format/currency";
import { PAYMENT_METHOD_LABELS } from "@/features/operations/constants";
import type { Invoice } from "@/features/operations/types";
import { invoicePartTotal, remaining } from "@/features/operations/utils/invoice";
import type { RepairRequest } from "@/models/requests/request.model";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "@/models/requests/request.model";
import type { Settings } from "@/models/settings/settings.model";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 1754;
const RENDER_SCALE = 2;
const PAGE_WIDTH = DESIGN_WIDTH * RENDER_SCALE;
const PAGE_HEIGHT = DESIGN_HEIGHT * RENDER_SCALE;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const GOLD = "#8a6800";
const GOLD_LIGHT = "#b98b2f";
const DARK = "#1f1f1f";
const MUTED = "#7b7469";
const BORDER = "#dfd3bf";
const SOFT = "#f8f3ea";
const PANEL = "#fbf8f2";
const WHITE = "#ffffff";
const BRAND_NAME = "AL-KHUBARA COMPANY";
const BRAND_SUBTITLE = "Maintenance Center";
const FALLBACK_EMAIL = "support@golden-control.com";
const FALLBACK_PHONE = "+966 50 123 4567";
const FALLBACK_ADDRESS = "AL Riyadh - حي العليا، شارع التخصصي";

type DocumentBrand = {
  centerName: string;
  secondaryName: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  terms: string[];
};

function text(value: unknown, fallback = "غير محدد") {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function escapeXml(value: unknown) {
  return text(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortText(value: unknown, max = 46) {
  const next = text(value, "");
  return next.length > max ? `${next.slice(0, max - 1)}…` : next;
}

function isoDate(value: string) {
  if (!value) return "غير محدد";
  return value.slice(0, 10);
}

function documentBrand(settings?: Settings | null): DocumentBrand {
  return {
    centerName: BRAND_NAME,
    secondaryName: text(settings?.secondaryName, BRAND_SUBTITLE),
    address: text(settings?.address, FALLBACK_ADDRESS),
    phone1: text(settings?.phone1, FALLBACK_PHONE),
    phone2: text(settings?.phone2, ""),
    email: text(settings?.email, FALLBACK_EMAIL),
    terms: [
      text(settings?.term1, "يعد هذا المستند تأكيداً للبيانات والخدمات المسجلة في النظام."),
      text(settings?.term2, "يجب الاحتفاظ بهذا المستند للرجوع إليه عند الحاجة."),
      text(settings?.term3, "لا يشمل الضمان الأعطال الناتجة عن سوء الاستخدام أو العبث بالجهاز."),
      text(settings?.term4, "جميع المبالغ والتواريخ معتمدة حسب البيانات المسجلة في النظام."),
    ],
  };
}

async function assetDataUri(fileName: string) {
  const filePath = path.join(process.cwd(), "public", "brand", fileName);
  const buffer = await readFile(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function svgText({
  x,
  y,
  value,
  size = 20,
  weight = 400,
  fill = DARK,
  anchor = "end",
  ltr = false,
}: {
  x: number;
  y: number;
  value: unknown;
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  ltr?: boolean;
}) {
  const direction = ltr ? "ltr" : "rtl";
  const visualAnchor = !ltr && anchor === "end"
    ? "start"
    : !ltr && anchor === "start"
      ? "end"
      : anchor;
  return `<text x="${x}" y="${y}" text-anchor="${visualAnchor}" direction="${direction}" style="unicode-bidi: isolate;" xml:space="preserve" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`;
}

function line(x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
}

function rect(x: number, y: number, width: number, height: number, options: { fill?: string; stroke?: string; radius?: number; strokeWidth?: number } = {}) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${options.radius ?? 10}" fill="${options.fill ?? WHITE}" stroke="${options.stroke ?? BORDER}" stroke-width="${options.strokeWidth ?? 1}"/>`;
}

function header(brand: DocumentBrand, logoUri: string) {
  const phone = [brand.phone1, brand.phone2].filter(Boolean).join("   ");
  return `
    <g>
      <image href="${logoUri}" x="480" y="58" width="280" height="244" preserveAspectRatio="xMidYMid meet"/>
      ${svgText({ x: 300, y: 372, value: brand.email, anchor: "middle", size: 15, fill: DARK, ltr: true })}
      ${svgText({ x: 620, y: 372, value: phone || FALLBACK_PHONE, anchor: "middle", size: 15, fill: DARK, ltr: true })}
      ${svgText({ x: 950, y: 372, value: brand.address, anchor: "middle", size: 15, fill: DARK })}
      ${line(130, 418, 1110, 418, GOLD_LIGHT, 3)}
      ${line(130, 452, 1110, 452, BORDER, 1)}
    </g>
  `;
}

function footer() {
  return `
    ${line(130, 1660, 1110, 1660, BORDER, 1)}
    ${svgText({ x: 620, y: 1720, value: "جميع الحقوق محفوظة © 2026", anchor: "middle", size: 14, fill: MUTED })}
  `;
}

function infoBox({
  x,
  y,
  width,
  title,
  rows,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: Array<[string, string, boolean?]>;
}) {
  const rowSvg = rows
    .map(([label, value, ltr], index) => {
      const rowY = y + 92 + index * 40;
      return `
        ${svgText({ x: x + width - 28, y: rowY, value: `${label}:`, size: 17, fill: MUTED })}
        ${svgText({ x: x + 28, y: rowY, value, size: 17, weight: 700, anchor: "start", ltr: ltr ?? false })}
      `;
    })
    .join("");
  return `
    ${rect(x, y, width, 212, { fill: PANEL, stroke: BORDER, radius: 12 })}
    ${svgText({ x: x + width - 28, y: y + 48, value: title, size: 22, weight: 800, fill: GOLD })}
    ${line(x + 28, y + 72, x + width - 28, y + 72, BORDER, 1)}
    ${rowSvg}
  `;
}

function tableHeader(x: number, y: number, width: number, columns: Array<{ label: string; x: number }>) {
  return `
    ${rect(x, y, width, 54, { fill: GOLD, stroke: GOLD, radius: 8 })}
    ${columns.map((column) => svgText({ x: column.x, y: y + 36, value: column.label, size: 17, weight: 800, fill: WHITE })).join("")}
  `;
}

function createPdfFromJpeg(jpeg: Buffer, width: number, height: number) {
  const content = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im1 Do\nQ`;
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg.toString("binary")}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

async function renderSvgToPdf(svg: string) {
  const { data, info } = await sharp(Buffer.from(svg))
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 98, chromaSubsampling: "4:4:4" })
    .toBuffer({ resolveWithObject: true });
  return createPdfFromJpeg(data, info.width, info.height);
}

function baseSvg(body: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}">
      <rect width="${DESIGN_WIDTH}" height="${DESIGN_HEIGHT}" fill="#ffffff"/>
      <style>
        text { font-family: Arial, "DejaVu Sans", sans-serif; dominant-baseline: alphabetic; }
      </style>
      ${body}
    </svg>
  `;
}

export async function renderInvoicePdf(invoice: Invoice, settings?: Settings | null) {
  const brand = documentBrand(settings);
  const logoUri = await assetDataUri("al-khubara-logo-transparent.png");
  const parts = invoice.parts.slice(0, 5);
  const payments = invoice.payments.slice(0, 3);
  const remainingAmount = remaining(invoice.total, invoice.paid);
  const partRows = parts
    .map((part, index) => {
      const y = 826 + index * 62;
      return `
        ${rect(130, y - 42, 980, 62, { fill: index % 2 ? "#fffdfa" : WHITE, stroke: BORDER, radius: 0 })}
        ${svgText({ x: 1048, y, value: shortText(part.name, 52), size: 17 })}
        ${svgText({ x: 655, y, value: String(part.quantity), size: 17, anchor: "middle", ltr: true })}
        ${svgText({ x: 505, y, value: formatMoney(part.unitPrice, invoice.currency), size: 16, anchor: "middle" })}
        ${svgText({ x: 260, y, value: formatMoney(invoicePartTotal(part), invoice.currency), size: 17, weight: 800, anchor: "middle" })}
      `;
    })
    .join("");
  const paymentRows = payments
    .map((payment, index) => {
      const y = 1210 + index * 44;
      return `
        ${rect(580, y - 29, 530, 44, { fill: index % 2 ? "#fffdfa" : WHITE, stroke: BORDER, radius: 0 })}
        ${svgText({ x: 1050, y, value: formatMoney(payment.convertedAmount ?? payment.amount, invoice.currency), size: 16, weight: 800 })}
        ${svgText({ x: 840, y, value: PAYMENT_METHOD_LABELS[payment.method] ?? payment.method, size: 15, anchor: "middle" })}
        ${svgText({ x: 650, y, value: isoDate(payment.paidAt), size: 15, anchor: "middle", ltr: true })}
      `;
    })
    .join("");
  const terms = brand.terms.slice(0, 4).map((term, index) =>
    svgText({ x: 1045, y: 1405 + index * 34, value: shortText(term, 92), size: 16, fill: DARK }),
  ).join("");

  return renderSvgToPdf(baseSvg(`
    ${header(brand, logoUri)}
    ${infoBox({
      x: 130,
      y: 500,
      width: 470,
      title: "بيانات العميل",
      rows: [
        ["الاسم", invoice.client],
        ["الجوال الأساسي", invoice.clientPhone, true],
        ["العنوان", shortText(invoice.clientAddress, 32)],
      ],
    })}
    ${infoBox({
      x: 640,
      y: 500,
      width: 470,
      title: "تفاصيل الفاتورة",
      rows: [
        ["رقم الفاتورة", invoice.invoiceNumber || invoice.id, true],
        ["رقم الطلب", invoice.requestNumber || invoice.orderId, true],
        ["تاريخ الإصدار", isoDate(invoice.issuedAt), true],
      ],
    })}
    ${tableHeader(130, 730, 980, [
      { label: "اسم القطعة", x: 1048 },
      { label: "الكمية", x: 655 },
      { label: "سعر الوحدة", x: 505 },
      { label: "الإجمالي", x: 260 },
    ])}
    ${partRows || svgText({ x: 620, y: 826, value: "لا توجد قطع مسجلة على هذه الفاتورة.", anchor: "middle", size: 18, fill: MUTED })}
    ${rect(130, 1104, 390, 238, { fill: "#202020", stroke: "#202020", radius: 12 })}
    ${svgText({ x: 470, y: 1160, value: "إجمالي الفاتورة", size: 16, fill: "#d9d2c2" })}
    ${svgText({ x: 250, y: 1160, value: formatMoney(invoice.total, invoice.currency), size: 30, weight: 800, fill: WHITE, anchor: "middle" })}
    ${line(160, 1192, 490, 1192, "#4a4a4a", 1)}
    ${svgText({ x: 470, y: 1240, value: "المبلغ المدفوع", size: 16, fill: "#d9d2c2" })}
    ${svgText({ x: 250, y: 1240, value: formatMoney(invoice.paid, invoice.currency), size: 20, weight: 800, fill: WHITE, anchor: "middle" })}
    ${rect(160, 1272, 330, 58, { fill: GOLD, stroke: GOLD, radius: 6 })}
    ${svgText({ x: 454, y: 1310, value: "المتبقي للسداد", size: 18, weight: 800, fill: WHITE })}
    ${svgText({ x: 235, y: 1310, value: formatMoney(remainingAmount, invoice.currency), size: 19, weight: 800, fill: WHITE, anchor: "middle" })}
    ${rect(580, 1104, 530, 238, { fill: WHITE, stroke: BORDER, radius: 10 })}
    ${svgText({ x: 1050, y: 1142, value: "سجل الدفعات المستلمة", size: 18, weight: 800, fill: GOLD })}
    ${line(600, 1162, 1090, 1162, BORDER, 1)}
    ${paymentRows || svgText({ x: 845, y: 1230, value: "لا توجد دفعات مسجلة.", anchor: "middle", size: 17, fill: MUTED })}
    ${rect(130, 1418, 305, 100, { fill: WHITE, stroke: GOLD_LIGHT, radius: 0, strokeWidth: 2 })}
    ${svgText({ x: 282, y: 1462, value: "فترة الضمان المعتمدة", anchor: "middle", size: 15, fill: GOLD })}
    ${svgText({ x: 282, y: 1508, value: text(invoice.warrantyDuration, "غير محددة"), anchor: "middle", size: 31, weight: 800 })}
    ${svgText({ x: 1045, y: 1360, value: "الشروط والأحكام", size: 19, weight: 800, fill: DARK })}
    ${terms}
    ${footer()}
  `));
}

export async function renderRequestPdf(request: RepairRequest, settings?: Settings | null) {
  const brand = documentBrand(settings);
  const logoUri = await assetDataUri("al-khubara-logo-transparent.png");
  const devices = request.devices.slice(0, 5);
  const deviceRows = devices
    .map((device, index) => {
      const y = 975 + index * 52;
      return `
        ${rect(130, y - 36, 980, 52, { fill: index % 2 ? "#fffdfa" : WHITE, stroke: BORDER, radius: 0 })}
        ${svgText({ x: 1060, y, value: String(index + 1), size: 16, anchor: "middle", ltr: true })}
        ${svgText({ x: 945, y, value: shortText(device.deviceType, 20), size: 16, anchor: "middle", ltr: true })}
        ${svgText({ x: 720, y, value: shortText(device.deviceName, 26), size: 16, anchor: "middle", ltr: true })}
        ${svgText({ x: 485, y, value: shortText(device.brand, 20), size: 16, anchor: "middle", ltr: true })}
        ${svgText({ x: 255, y, value: shortText(device.model, 22), size: 16, anchor: "middle", ltr: true })}
      `;
    })
    .join("");
  const printedAt = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Amman",
  }).format(new Date());

  return renderSvgToPdf(baseSvg(`
    <rect x="1062" y="0" width="100" height="150" fill="${SOFT}" rx="18"/>
    ${header(brand, logoUri)}
    ${rect(130, 500, 980, 95, { fill: SOFT, stroke: BORDER, radius: 4 })}
    ${line(620, 520, 620, 575, BORDER, 1)}
    ${svgText({ x: 1030, y: 545, value: "رقم الطلب", size: 20, fill: MUTED })}
    ${svgText({ x: 1030, y: 578, value: `#${request.requestNumber}`, size: 18, weight: 800, fill: GOLD, ltr: true })}
    ${svgText({ x: 470, y: 545, value: "تاريخ الإنشاء", size: 21, fill: MUTED })}
    ${svgText({ x: 470, y: 578, value: isoDate(request.createdAt), size: 18, weight: 700, ltr: true })}
    ${line(620, 620, 620, 858, GOLD_LIGHT, 5)}
    ${line(1110, 620, 1110, 858, GOLD_LIGHT, 5)}
    ${svgText({ x: 1040, y: 646, value: "بيانات المسؤول", size: 22, weight: 700, fill: DARK })}
    ${svgText({ x: 1030, y: 704, value: "الموظف المسؤول:", size: 19, fill: MUTED })}
    ${svgText({ x: 750, y: 704, value: text(request.technicianName), size: 22, anchor: "start" })}
    ${line(690, 728, 1070, 728, BORDER, 1)}
    ${svgText({ x: 1030, y: 766, value: "نوع الطلب:", size: 19, fill: MUTED })}
    ${svgText({ x: 750, y: 766, value: REQUEST_TYPE_LABELS[request.type], size: 20, fill: GOLD, anchor: "start" })}
    ${line(690, 790, 1070, 790, BORDER, 1)}
    ${svgText({ x: 520, y: 646, value: "بيانات العميل", size: 22, weight: 700, fill: DARK })}
    ${svgText({ x: 510, y: 704, value: "اسم العميل:", size: 19, fill: MUTED })}
    ${svgText({ x: 205, y: 704, value: request.customer.name, size: 22, anchor: "start" })}
    ${line(160, 728, 540, 728, BORDER, 1)}
    ${svgText({ x: 510, y: 766, value: "الجوال الأساسي:", size: 19, fill: MUTED })}
    ${svgText({ x: 205, y: 766, value: request.customer.firstPhone, size: 20, anchor: "start", ltr: true })}
    ${line(160, 790, 540, 790, BORDER, 1)}
    ${svgText({ x: 510, y: 828, value: "العنوان:", size: 19, fill: MUTED })}
    ${svgText({ x: 205, y: 828, value: shortText(request.customer.address, 30), size: 19, anchor: "start" })}
    ${svgText({ x: 1070, y: 852, value: "الأجهزة المشمولة بالطلب", size: 20, weight: 700, fill: DARK })}
    ${rect(130, 875, 980, 60, { fill: WHITE, stroke: BORDER, radius: 8 })}
    ${svgText({ x: 1060, y: 912, value: "#", size: 17, weight: 800, anchor: "middle" })}
    ${svgText({ x: 945, y: 912, value: "نوع الجهاز", size: 17, weight: 800 })}
    ${svgText({ x: 720, y: 912, value: "اسم الجهاز", size: 17, weight: 800 })}
    ${svgText({ x: 485, y: 912, value: "العلامة التجارية", size: 17, weight: 800, anchor: "middle" })}
    ${svgText({ x: 255, y: 912, value: "الموديل", size: 17, weight: 800, anchor: "middle" })}
    ${deviceRows}
    ${rect(130, 1225, 980, 132, { fill: "#fbf4ea", stroke: BORDER, radius: 10 })}
    ${svgText({ x: 1060, y: 1270, value: "وصف العطل", size: 20, weight: 800, fill: GOLD })}
    ${svgText({ x: 1060, y: 1322, value: shortText(request.faultDescription, 98), size: 21, fill: DARK })}
    ${rect(130, 1385, 980, 132, { fill: WHITE, stroke: BORDER, radius: 10, strokeWidth: 1 })}
    ${svgText({ x: 1060, y: 1430, value: "ملاحظات إضافية", size: 20, fill: MUTED })}
    ${svgText({ x: 1060, y: 1482, value: shortText(request.notes, 98), size: 19, fill: MUTED })}
    ${rect(130, 1560, 980, 100, { fill: SOFT, stroke: "none", radius: 4 })}
    ${svgText({ x: 1060, y: 1605, value: "الشروط والأحكام العامة:", size: 18, fill: DARK })}
    ${svgText({ x: 1060, y: 1642, value: `حالة الطلب: ${REQUEST_STATUS_LABELS[request.status]} - هذا المستند تأكيد لاستلام بيانات الطلب وليس تأكيداً نهائياً للإصلاح.`, size: 16, fill: MUTED })}
    ${svgText({ x: 130, y: 1700, value: `Printed at ${printedAt}`, size: 15, fill: MUTED, anchor: "start", ltr: true })}
    ${footer()}
  `));
}
