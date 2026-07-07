import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { BACKEND_API_ENDPOINTS } from "@/config/api-endpoints";
import { localDateKey, localDisplayDateTime } from "@/lib/format/date";
import {
  normalizeDashboardTechnicianPerformanceResponse,
} from "@/models/dashboard/dashboard.model";
import {
  normalizeInventoryMovementList,
} from "@/models/inventory/inventory.model";
import {
  normalizeRepairRequestListResponse,
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  type RepairRequest,
} from "@/models/requests/request.model";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ type: string }> };
type ReportType = "orders" | "technicians" | "inventory-movements";
type ReportRow = string[];

const REPORT_TITLES: Record<ReportType, string> = {
  orders: "تقرير الطلبات",
  technicians: "تقارير الفنيين",
  "inventory-movements": "تقارير حركة المخزون",
};

const REPORT_FILE_NAMES: Record<ReportType, string> = {
  orders: "orders-report.pdf",
  technicians: "technicians-report.pdf",
  "inventory-movements": "inventory-movements-report.pdf",
};

const MOVEMENT_TYPE_LABELS = {
  supply: "توريد",
  withdraw: "صرف",
  adjustment: "تسوية",
} as const;

function isReportType(value: string): value is ReportType {
  return value === "orders" || value === "technicians" || value === "inventory-movements";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dataRecord(payload: unknown): Record<string, unknown> {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return {};
  const root = payload as Record<string, unknown>;
  const data = root.data;
  return typeof data === "object" && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : root;
}

function paginationTotal(payload: unknown, fallback: number) {
  const root = typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
  const data = dataRecord(payload);
  const pagination = (
    typeof root.pagination === "object" && root.pagination !== null
      ? root.pagination
      : typeof data.pagination === "object" && data.pagination !== null
        ? data.pagination
        : {}
  ) as Record<string, unknown>;
  const total = Number(pagination.total ?? pagination.totalItems ?? pagination.totalCount);
  return Number.isFinite(total) ? total : fallback;
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
    throw new Error(`Backend report source failed with ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function fetchFirstJson(urls: string | readonly string[], authorization: string) {
  const candidates = Array.isArray(urls) ? urls : [urls];
  let lastError: unknown;

  for (const url of candidates) {
    try {
      return await fetchJson(url, authorization);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Backend report source failed.");
}

async function fetchRequestReportRows(from: string, to: string, authorization: string) {
  const pageSize = 100;
  const allRequests: RepairRequest[] = [];
  let page = 1;
  let total = 0;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      startDate: from,
      endDate: to,
    });
    const payload = await fetchJson(
      `${BACKEND_API_ENDPOINTS.requests.root}?${searchParams}`,
      authorization,
    );
    const normalized = normalizeRepairRequestListResponse(payload, {
      page,
      limit: pageSize,
    });

    allRequests.push(...normalized.items);
    total = normalized.total || paginationTotal(payload, allRequests.length);
    page += 1;
  } while (allRequests.length < total && page <= 50);

  return {
    headers: ["رقم الطلب", "العميل", "الجهاز", "النوع", "الأولوية", "الحالة", "وقت الإنشاء"],
    rows: allRequests.map((request) => [
      request.requestNumber,
      request.customer.name || "غير محدد",
      request.devices[0]?.deviceName || request.devices[0]?.deviceType || "غير محدد",
      REQUEST_TYPE_LABELS[request.type],
      REQUEST_PRIORITY_LABELS[request.priority],
      REQUEST_STATUS_LABELS[request.status],
      localDisplayDateTime(request.createdAt, "غير محدد"),
    ]),
  };
}

async function fetchTechnicianReportRows(authorization: string) {
  const payload = await fetchFirstJson(
    BACKEND_API_ENDPOINTS.dashboard.technicianPerformance,
    authorization,
  );
  const report = normalizeDashboardTechnicianPerformanceResponse(payload);

  return {
    headers: ["الفني", "رقم المستخدم", "مكتملة", "غير مكتملة", "نشطة", "مسحوبة للمركز", "مبيعات"],
    rows: report.technicians.map((technician) => [
      technician.technicianName || "غير محدد",
      technician.userNumber || "غير محدد",
      technician.completedCount,
      technician.incompletedCount,
      technician.activeCount,
      technician.pulltocenterCount,
      technician.sales,
    ]),
  };
}

async function fetchInventoryMovementReportRows(from: string, to: string, authorization: string) {
  const payload = await fetchJson(BACKEND_API_ENDPOINTS.inventory.movements, authorization);
  const movements = normalizeInventoryMovementList(payload).filter((movement) => {
    const date = localDateKey(movement.createdAt);
    return (!from || date >= from) && (!to || date <= to);
  });

  return {
    headers: ["رقم الحركة", "رقم القطعة", "اسم القطعة", "نوع الحركة", "الكمية", "المسؤول", "وقت الإنشاء"],
    rows: movements.map((movement) => [
      movement.movementNumber || movement.id,
      movement.partNumber || "غير محدد",
      movement.partName || "غير محدد",
      MOVEMENT_TYPE_LABELS[movement.movementType],
      movement.quantity,
      movement.owner || "غير محدد",
      localDisplayDateTime(movement.createdAt, "غير محدد"),
    ]),
  };
}

function reportHtml({
  title,
  from,
  to,
  headers,
  rows,
}: {
  title: string;
  from: string;
  to: string;
  headers: string[];
  rows: ReportRow[];
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
      margin-bottom: 18px;
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
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">تم إنشاء التقرير من البيانات الحقيقية المتاحة في النظام.</div>
</body>
</html>`;
}

async function renderPdf(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });

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
        ? await fetchRequestReportRows(from, to, authorization)
        : type === "technicians"
          ? await fetchTechnicianReportRows(authorization)
          : await fetchInventoryMovementReportRows(from, to, authorization);

    const pdf = await renderPdf(
      reportHtml({
        title: REPORT_TITLES[type],
        from,
        to,
        headers: report.headers,
        rows: report.rows.map((row) => row.map((cell) => String(cell ?? ""))),
      }),
    );

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${REPORT_FILE_NAMES[type]}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "تعذر جلب التقرير من الخادم." },
      { status: 502 },
    );
  }
}
