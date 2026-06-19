import type { Order, Invoice } from "../types";
import { formatMoney } from "@/lib/format/currency";
import { PAYMENT_LABELS } from "../constants";
import { typeLabel, invoicePartTotal, remaining } from "./invoice";

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

export function buildSimpleInvoicePdf(invoice: Invoice): Blob {
  const lines = [
    "Golden Control - Invoice",
    `Invoice: ${invoice.id}`,
    `Type: ${typeLabel(invoice.type)}`,
    `Status: ${PAYMENT_LABELS[invoice.status]}`,
    `Client: ${escapePdfText(invoice.client)}`,
    `Phone: ${invoice.clientPhone}`,
    `Technician: ${escapePdfText(invoice.technician)}`,
    `Total: ${formatMoney(invoice.total, invoice.currency)}`,
    `Paid: ${formatMoney(invoice.paid, invoice.currency)}`,
    `Remaining: ${formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}`,
    `Warranty: ${escapePdfText(invoice.warrantyDuration || "N/A")}`,
  ];
  const objects: string[] = [];
  const content =
    "BT /F1 14 Tf 50 780 Td " +
    lines.map((line, index) => `${index === 0 ? "" : "0 -24 Td "}(${escapePdfText(line)}) Tj`).join(" ") +
    " ET";

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadInvoicePdf(invoice: Invoice) {
  const url = URL.createObjectURL(buildSimpleInvoicePdf(invoice));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printInvoice(invoice: Invoice) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const partsRows = invoice.parts
    .map(
      (part) => `
        <tr>
          <td>${part.name}</td>
          <td>${part.quantity}</td>
          <td>${formatMoney(part.unitPrice, invoice.currency)}</td>
          <td>${formatMoney(invoicePartTotal(part), invoice.currency)}</td>
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1f1f1f; }
          h1 { color: #8a6b00; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .box { border: 1px solid #ddd; padding: 12px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>فاتورة ${invoice.id}</h1>
        <div class="grid">
          <div class="box">العميل: ${invoice.client}</div>
          <div class="box">الهاتف: ${invoice.clientPhone}</div>
          <div class="box">الفني: ${invoice.technician}</div>
          <div class="box">الحالة: ${PAYMENT_LABELS[invoice.status]}</div>
          <div class="box">الإجمالي: ${formatMoney(invoice.total, invoice.currency)}</div>
          <div class="box">المتبقي: ${formatMoney(remaining(invoice.total, invoice.paid), invoice.currency)}</div>
        </div>
        <table>
          <thead><tr><th>القطعة</th><th>الكمية</th><th>سعر القطعة</th><th>الإجمالي</th></tr></thead>
          <tbody>${partsRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
