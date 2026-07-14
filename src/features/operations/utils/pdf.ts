import type { Order } from "../types";

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
