import { NextResponse } from "next/server";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { launchPdfBrowser } from "@/lib/pdf/launch-browser";
import { localDateKey, localDisplayDateTime } from "@/lib/format/date";
import {
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from "@/models/requests/request.model";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ type: string }> };
type ReportType = "orders" | "technicians" | "inventory-movements" | "financial";
type ReportRow = string[];
type SummaryItem = { label: string; value: string };

interface ReportContent {
  headers: string[];
  rows: ReportRow[];
  summary: SummaryItem[];
  periodStart: string;
  periodEnd: string;
}

const REPORT_TITLES: Record<ReportType, string> = {
  orders: "تقرير الطلبات",
  technicians: "تقارير الفنيين",
  "inventory-movements": "تقارير حركة المخزون",
  financial: "التقرير المالي",
};

const REPORT_FILE_NAMES: Record<ReportType, string> = {
  orders: "orders-report.pdf",
  technicians: "technicians-report.pdf",
  "inventory-movements": "inventory-movements-report.pdf",
  financial: "financial-report.pdf",
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  supply: "توريد",
  withdraw: "صرف",
  withdrawal: "صرف",
  adjust: "تسوية",
  adjustment: "تسوية",
  return: "إرجاع",
  sale: "بيع",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  paid: "مدفوعة",
  paid_partial: "مدفوعة جزئياً",
  refunded: "مرجعة",
};

function isReportType(value: string): value is ReportType {
  return (
    value === "orders" ||
    value === "technicians" ||
    value === "inventory-movements" ||
    value === "financial"
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dataRecord(payload: unknown): JsonRecord {
  if (!isRecord(payload)) return {};
  return isRecord(payload.data) ? payload.data : payload;
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function labelFor(map: Record<string, string>, key: string) {
  return map[key] ?? key ?? "غير محدد";
}

function money(value: unknown) {
  const amount = num(value);
  return `${amount.toLocaleString("en-US")} ل.س`;
}

function displayDate(value: string, fallback: string) {
  return localDateKey(value) || fallback;
}

/** "completed: 2, new: 2" → "مكتمل: 2 • جديد: 2" using the given label map. */
function breakdownText(value: unknown, labels: Record<string, string>) {
  if (!isRecord(value)) return "";
  return Object.entries(value)
    .map(([key, count]) => `${labelFor(labels, key)}: ${num(count)}`)
    .join(" • ");
}

/** Carries the upstream backend's real status code (400/401/403/500...)
 * through to the outer response, instead of the generic 502 this route used
 * to always send — the client needs the real status to tell "bad date
 * range" (400) apart from "server down" (502). */
class UpstreamReportError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "UpstreamReportError";
  }
}

async function fetchJson(url: string, authorization: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: authorization,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // Surface the backend's own validation message (e.g. a rejected
    // month/year combination) instead of a generic status-only error, so the
    // UI can show the real reason instead of a blind "تعذر جلب التقرير".
    const body = await response.json().catch(() => null);
    const message = isRecord(body) && typeof body.message === "string" ? body.message : null;
    throw new UpstreamReportError(
      message ?? `Backend report source failed with ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<unknown>;
}

async function fetchReportData(url: string, from: string, to: string, authorization: string) {
  const search = new URLSearchParams({ startDate: from, endDate: to });
  const payload = await fetchJson(`${url}?${search}`, authorization);
  return dataRecord(payload);
}

/**
 * GET /api/reports/financial's real contract is `year` + `months` (up to 3
 * month numbers within that single year) — not a `startDate`/`endDate` range
 * like the other report types. The screen still only picks a single-year
 * month range (`from`/`to` day strings both fall in the same year), so the
 * year/months are derived from that here rather than changing the screen's
 * wire format for every report type.
 */
async function fetchFinancialReportData(from: string, to: string, authorization: string) {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  const year = fromYear;
  const lastMonth = toYear === fromYear ? toMonth : 12;
  const months: number[] = [];
  for (let month = fromMonth; month <= lastMonth; month += 1) months.push(month);

  const search = new URLSearchParams({ year: String(year) });
  for (const month of months) search.append("months", String(month));
  const payload = await fetchJson(`${BACKEND_API_ENDPOINTS.reports.financial}?${search}`, authorization);
  return dataRecord(payload);
}

// GET /api/reports/requests
async function fetchRequestsReport(from: string, to: string, authorization: string): Promise<ReportContent> {
  const data = await fetchReportData(BACKEND_API_ENDPOINTS.reports.requests, from, to, authorization);
  const summary = isRecord(data.summary) ? data.summary : {};
  const requests = recordArray(data.requests);

  const summaryItems: SummaryItem[] = [
    { label: "إجمالي الطلبات", value: String(num(summary.totalRequests)) },
    { label: "مرتبطة بفاتورة", value: String(num(summary.withInvoice)) },
    { label: "الطلبات المكررة", value: String(num(summary.repeated)) },
  ];
  const byStatus = breakdownText(summary.byStatus, REQUEST_STATUS_LABELS);
  const byType = breakdownText(summary.byType, REQUEST_TYPE_LABELS);
  const byPriority = breakdownText(summary.byPriority, REQUEST_PRIORITY_LABELS);
  if (byStatus) summaryItems.push({ label: "حسب الحالة", value: byStatus });
  if (byType) summaryItems.push({ label: "حسب النوع", value: byType });
  if (byPriority) summaryItems.push({ label: "حسب الأولوية", value: byPriority });

  return {
    headers: [
      "رقم الطلب",
      "العميل",
      "هاتف العميل",
      "النوع",
      "الأولوية",
      "الحالة",
      "وصف العطل",
      "الفنيون",
      "الفاتورة",
      "وقت الإنشاء",
    ],
    rows: requests.map((request) => {
      const customer = isRecord(request.customer) ? request.customer : {};
      const technicians = recordArray(request.technicians)
        .map((technician) => str(technician.fullName))
        .filter(Boolean)
        .join("، ");
      const invoice = isRecord(request.invoice) ? request.invoice : null;
      const invoiceText = invoice
        ? `${money(invoice.totalAmount)} (${labelFor(INVOICE_STATUS_LABELS, str(invoice.status))})`
        : "لا يوجد";

      return [
        str(request.requestNumber) || "غير محدد",
        str(customer.name) || "غير محدد",
        str(customer.firstPhone) || "غير محدد",
        labelFor(REQUEST_TYPE_LABELS, str(request.type)),
        labelFor(REQUEST_PRIORITY_LABELS, str(request.priority)),
        labelFor(REQUEST_STATUS_LABELS, str(request.status)),
        str(request.faultDescription) || "غير محدد",
        technicians || "غير محدد",
        invoiceText,
        localDisplayDateTime(str(request.createdAt), "غير محدد"),
      ];
    }),
    summary: summaryItems,
    periodStart: str(data.periodStart),
    periodEnd: str(data.periodEnd),
  };
}

// GET /api/reports/technicians
async function fetchTechniciansReport(from: string, to: string, authorization: string): Promise<ReportContent> {
  const data = await fetchReportData(BACKEND_API_ENDPOINTS.reports.technicians, from, to, authorization);
  const summary = isRecord(data.summary) ? data.summary : {};
  const technicians = recordArray(data.technicians);

  return {
    headers: [
      "الفني",
      "رقم المستخدم",
      "الهاتف",
      "الطلبات المسندة",
      "المكتملة",
      "قيد التنفيذ",
      "غير المكتملة",
      "المفقودة",
      "نسبة الإنجاز",
    ],
    rows: technicians.map((technician) => [
      str(technician.fullName) || "غير محدد",
      str(technician.userNumber) || "غير محدد",
      str(technician.phone) || "غير محدد",
      String(num(technician.assigned)),
      String(num(technician.completed)),
      String(num(technician.inProgress)),
      String(num(technician.inCompleted)),
      String(num(technician.lost)),
      `${num(technician.completionRate)}%`,
    ]),
    summary: [
      { label: "عدد الفنيين", value: String(num(summary.technicianCount)) },
      { label: "إجمالي المسندة", value: String(num(summary.totalAssigned)) },
      { label: "إجمالي المكتملة", value: String(num(summary.totalCompleted)) },
      { label: "قيد التنفيذ", value: String(num(summary.totalInProgress)) },
      { label: "الملغاة", value: String(num(summary.totalCancelled)) },
    ],
    periodStart: str(data.periodStart),
    periodEnd: str(data.periodEnd),
  };
}

// GET /api/reports/inventory-movements
async function fetchInventoryMovementsReport(from: string, to: string, authorization: string): Promise<ReportContent> {
  const data = await fetchReportData(
    BACKEND_API_ENDPOINTS.reports.inventoryMovements,
    from,
    to,
    authorization,
  );
  const summary = isRecord(data.summary) ? data.summary : {};
  const movements = recordArray(data.movements);

  const summaryItems: SummaryItem[] = [
    { label: "إجمالي الحركات", value: String(num(summary.totalMovements)) },
  ];
  if (isRecord(summary.byType)) {
    for (const [type, detail] of Object.entries(summary.byType)) {
      if (!isRecord(detail)) continue;
      summaryItems.push({
        label: labelFor(MOVEMENT_TYPE_LABELS, type),
        value: `${num(detail.count)} حركة (الكمية: ${num(detail.totalQuantity)})`,
      });
    }
  }

  return {
    headers: [
      "رقم الحركة",
      "القطعة",
      "رقم القطعة",
      "نوع الحركة",
      "الكمية",
      "المسؤول",
      "المرجع",
      "تاريخ الحركة",
    ],
    rows: movements.map((movement) => {
      const part = isRecord(movement.part) ? movement.part : {};
      const responsible = isRecord(movement.responsible) ? movement.responsible : {};

      return [
        str(movement.movementNo) || "غير محدد",
        str(part.name) || "غير محددة",
        str(part.sparePartNumber) || "غير محدد",
        labelFor(MOVEMENT_TYPE_LABELS, str(movement.movementType)),
        String(num(movement.quantity)),
        str(responsible.fullName) || "غير محدد",
        str(movement.reference) || "غير محدد",
        localDisplayDateTime(str(movement.movementDate), "غير محدد"),
      ];
    }),
    summary: summaryItems,
    periodStart: str(data.periodStart),
    periodEnd: str(data.periodEnd),
  };
}

// GET /api/reports/financial
async function fetchFinancialReport(from: string, to: string, authorization: string): Promise<ReportContent> {
  const data = await fetchFinancialReportData(from, to, authorization);
  // The real response nests the totals under `data.summary` with a `...Syp`
  // suffix (e.g. `totalRevenuesSyp`); the older flat field names are kept as
  // fallbacks in case the backend shape changes again.
  const summary = isRecord(data.summary) ? data.summary : data;

  return {
    headers: ["البند", "القيمة"],
    rows: [
      ["إجمالي الإيرادات", money(summary.totalRevenuesSyp ?? summary.totalRevenues)],
      ["التكاليف الثابتة", money(summary.fixedCostsSyp ?? summary.fixedCosts)],
      ["التكاليف المتغيرة", money(summary.variableExpensesSum ?? summary.variableCosts)],
      ["تكاليف القطع", money(summary.partsCostsSyp ?? summary.partsCosts)],
      ["صافي الربح", money(summary.netProfitSyp ?? summary.netProfit)],
    ],
    summary: [{ label: "صافي الربح", value: money(summary.netProfitSyp ?? summary.netProfit) }],
    periodStart: str(summary.periodStart),
    periodEnd: str(summary.periodEnd),
  };
}

function reportHtml({
  title,
  from,
  to,
  headers,
  rows,
  summary,
}: {
  title: string;
  from: string;
  to: string;
  headers: string[];
  rows: ReportRow[];
  summary: SummaryItem[];
}) {
  const tableHeaders = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const tableRows = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="${headers.length}" class="empty">لا توجد بيانات ضمن الفترة المختارة.</td></tr>`;
  const summaryItems = summary
    .map(
      (item) => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value">${escapeHtml(item.value)}</span>
        </div>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 landscape; margin: 13mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #201a12;
      background: #fff;
      font-family: Arial, "Tahoma", sans-serif;
      direction: rtl;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #9b7409;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    h1 {
      margin: 0 0 7px;
      color: #7a5a05;
      font-size: 24px;
    }
    .meta {
      color: #6f675a;
      font-size: 12px;
      line-height: 1.8;
    }
    .count {
      border: 1px solid #e2d8c6;
      border-radius: 6px;
      padding: 10px 14px;
      color: #7a5a05;
      font-weight: 700;
      white-space: nowrap;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .summary-item {
      border: 1px solid #e2d8c6;
      border-radius: 6px;
      background: #fbf8f2;
      padding: 7px 11px;
      font-size: 11px;
    }
    .summary-label { color: #6f675a; margin-inline-end: 6px; }
    .summary-value { color: #7a5a05; font-weight: 700; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e5ddcf;
      padding: 8px 7px;
      text-align: right;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      background: #8a6908;
      color: #fff;
      font-weight: 700;
    }
    tr:nth-child(even) td { background: #fbf8f2; }
    .empty {
      color: #6f675a;
      text-align: center;
      padding: 28px;
    }
    .footer {
      margin-top: 14px;
      color: #8f8778;
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">الفترة: ${escapeHtml(from)} إلى ${escapeHtml(to)}</div>
      <div class="meta">وقت الإنشاء: ${escapeHtml(localDisplayDateTime(new Date()))}</div>
    </div>
    <div class="count">عدد السجلات: ${rows.length}</div>
  </header>
  ${summaryItems ? `<section class="summary">${summaryItems}</section>` : ""}
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">تم إنشاء التقرير من البيانات الحقيقية المتاحة في النظام.</div>
</body>
</html>`;
}

async function renderPdf(html: string) {
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "يجب تسجيل الدخول أولاً." },
      { status: 401 },
    );
  }

  const { type } = await params;
  if (!isReportType(type)) {
    return NextResponse.json(
      { success: false, message: "نوع التقرير غير مدعوم." },
      { status: 404 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";

  if (!from || !to) {
    return NextResponse.json(
      { success: false, message: "تاريخ البداية والنهاية مطلوبان." },
      { status: 400 },
    );
  }

  try {
    const report =
      type === "orders"
        ? await fetchRequestsReport(from, to, authorization)
        : type === "technicians"
          ? await fetchTechniciansReport(from, to, authorization)
          : type === "inventory-movements"
            ? await fetchInventoryMovementsReport(from, to, authorization)
            : await fetchFinancialReport(from, to, authorization);

    const pdf = await renderPdf(
      reportHtml({
        title: REPORT_TITLES[type],
        from: displayDate(report.periodStart, from),
        to: displayDate(report.periodEnd, to),
        headers: report.headers,
        rows: report.rows.map((row) => row.map((cell) => String(cell ?? ""))),
        summary: report.summary,
      }),
    );

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${REPORT_FILE_NAMES[type]}"`,
      },
    });
  } catch (error) {
    // Previously swallowed silently (generic message, no trace), which made
    // real backend rejections (e.g. an invalid month/year combination)
    // indistinguishable from a genuine connectivity failure.
    console.error(`GET /api/reports/${type} failed —`, error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "تعذر جلب التقرير من الخادم.",
      },
      { status: error instanceof UpstreamReportError ? error.status : 502 },
    );
  }
}
