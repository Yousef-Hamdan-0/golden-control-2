import { z } from "zod";
import { ApiError } from "@/helpers/api.helper";
import {
  normalizeRequestStatus,
  type RepairRequestStatus,
} from "@/models/requests/request.model";

const numberFromApi = z.preprocess(
  (value) => value ?? 0,
  z.coerce.number().catch(0),
);
const stringFromApi = z.preprocess(
  (value) => value ?? "",
  z.coerce.string().catch(""),
);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(record: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const normalized =
      typeof value === "string" ? value.replace(/,/g, "").trim() : value;
    const number = typeof normalized === "number" ? normalized : Number(normalized);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null) return String(value);
  }
  return "";
}

function arrayValue(...values: unknown[]): unknown[] {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function responseData(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  return payload.data ?? payload;
}

function assertSuccessfulResponse(payload: unknown, fallbackMessage: string) {
  if (!isRecord(payload) || payload.success !== false) return;
  throw new ApiError(stringValue(payload.message, payload.error, fallbackMessage));
}

const DashboardLastRequestSchema = z
  .object({
    requestId: stringFromApi,
    requestNumber: stringFromApi,
    customerName: stringFromApi,
    deviceInfo: stringFromApi,
    technicianName: stringFromApi,
    status: z.unknown(),
  })
  .passthrough();

const DashboardStatsDataSchema = z
  .object({
    totalRequestsCount: numberFromApi,
    internalRequestsCount: numberFromApi,
    externalRequestsCount: numberFromApi,
    completedCount: numberFromApi,
    incompletedCount: numberFromApi,
    pulltocenterCount: numberFromApi,
    repeatedCount: numberFromApi,
    postponedCount: numberFromApi,
    notrepairableCount: numberFromApi,
    externalInvoicesCount: numberFromApi,
    internalInvoicesCount: numberFromApi,
    newCustomersToday: numberFromApi,
    totalRevenuesSyp: numberFromApi,
    salesSyp: numberFromApi,
    netProfitTodaySyp: numberFromApi,
    lastRequests: z.array(DashboardLastRequestSchema).optional().default([]),
  })
  .passthrough();

const DashboardStatsResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: DashboardStatsDataSchema.optional(),
  })
  .passthrough();

const TechnicianTimelineItemSchema = z
  .object({
    label: stringFromApi.optional(),
    status: z.unknown().optional(),
    value: z.unknown().optional(),
  })
  .passthrough();

const DashboardTechnicianSchema = z
  .object({
    technicianId: stringFromApi,
    technicianName: stringFromApi,
    userNumber: stringFromApi,
    completedCount: numberFromApi,
    incompletedCount: numberFromApi,
    activeCount: numberFromApi,
    pulltocenterCount: numberFromApi,
    timeline: z.array(TechnicianTimelineItemSchema).optional().default([]),
    paymentsSyp: numberFromApi,
    paymentsUsd: numberFromApi,
    sales: numberFromApi,
  })
  .passthrough();

const DashboardTechnicianPerformanceDataSchema = z
  .object({
    overall: z
      .object({
        completedToday: numberFromApi,
        incompletedToday: numberFromApi,
        pulltocenterToday: numberFromApi,
        activeToday: numberFromApi,
        paymentsSypToday: numberFromApi,
        paymentsUsdToday: numberFromApi,
      })
      .passthrough()
      .optional()
      .default({
        completedToday: 0,
        incompletedToday: 0,
        pulltocenterToday: 0,
        activeToday: 0,
        paymentsSypToday: 0,
        paymentsUsdToday: 0,
      }),
    technicians: z.array(DashboardTechnicianSchema).optional().default([]),
  })
  .passthrough();

const DashboardTechnicianPerformanceResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: DashboardTechnicianPerformanceDataSchema.optional(),
  })
  .passthrough();

export interface DashboardLastRequest {
  requestId: string;
  requestNumber: string;
  customerName: string;
  deviceInfo: string;
  technicianName: string;
  status: RepairRequestStatus;
}

export interface DashboardStats {
  totalRequestsCount: number;
  internalRequestsCount: number;
  externalRequestsCount: number;
  completedCount: number;
  incompletedCount: number;
  pulltocenterCount: number;
  repeatedCount: number;
  postponedCount: number;
  notrepairableCount: number;
  externalInvoicesCount: number;
  internalInvoicesCount: number;
  newCustomersToday: number;
  totalRevenuesSyp: number;
  salesSyp: number;
  netProfitTodaySyp: number;
  lastRequests: DashboardLastRequest[];
}

export type DashboardTechnicianTimelineItem = z.infer<
  typeof TechnicianTimelineItemSchema
>;

export interface DashboardTechnicianPerformanceItem {
  technicianId: string;
  technicianName: string;
  userNumber: string;
  completedCount: number;
  incompletedCount: number;
  activeCount: number;
  pulltocenterCount: number;
  timeline: DashboardTechnicianTimelineItem[];
  paymentsSyp: number;
  paymentsUsd: number;
  sales: number;
}

export interface DashboardTechnicianPerformance {
  overall: {
    completedToday: number;
    incompletedToday: number;
    pulltocenterToday: number;
    activeToday: number;
    paymentsSypToday: number;
    paymentsUsdToday: number;
  };
  technicians: DashboardTechnicianPerformanceItem[];
}

function normalizeDashboardLastRequest(payload: unknown): DashboardLastRequest {
  const parsed = DashboardLastRequestSchema.safeParse(payload);
  const request = parsed.success ? parsed.data : DashboardLastRequestSchema.parse({});
  const record = isRecord(request) ? request : {};

  return {
    requestId: stringValue(
      recordValue(record, "requestId", "request_id", "id", "_id"),
      request.requestId,
    ),
    requestNumber: stringValue(
      recordValue(record, "requestNumber", "request_number", "number"),
      request.requestNumber,
    ),
    customerName: stringValue(
      recordValue(record, "customerName", "customer_name", "clientName", "client_name"),
      request.customerName,
    ),
    deviceInfo: stringValue(
      recordValue(record, "deviceInfo", "device_info", "device", "devices"),
      request.deviceInfo,
    ),
    technicianName: stringValue(
      recordValue(record, "technicianName", "technician_name", "technician"),
      request.technicianName,
    ),
    status: normalizeRequestStatus(recordValue(record, "status", "requestStatus")),
  };
}

export function normalizeDashboardStatsResponse(payload: unknown): DashboardStats {
  assertSuccessfulResponse(payload, "تعذر جلب إحصائيات لوحة التحكم.");

  const response = DashboardStatsResponseSchema.safeParse(payload);
  if (!response.success) {
    throw new ApiError("استجابة إحصائيات لوحة التحكم غير مطابقة للنموذج المتوقع.");
  }

  const parsed = DashboardStatsDataSchema.safeParse(response.data.data ?? responseData(payload));
  if (!parsed.success) {
    throw new ApiError("لم يرسل الخادم بيانات إحصائيات لوحة التحكم.");
  }

  const data = parsed.data;
  const record = data as unknown as JsonRecord;
  const lastRequests = arrayValue(
    recordValue(record, "lastRequests", "last_requests", "latestRequests", "recentRequests"),
    data.lastRequests,
  );

  return {
    totalRequestsCount: numberValue(
      recordValue(record, "totalRequestsCount", "total_requests_count", "requestsCount", "totalRequests"),
      data.totalRequestsCount,
    ),
    internalRequestsCount: numberValue(
      recordValue(record, "internalRequestsCount", "internal_requests_count", "internalCount"),
      data.internalRequestsCount,
    ),
    externalRequestsCount: numberValue(
      recordValue(record, "externalRequestsCount", "external_requests_count", "externalCount"),
      data.externalRequestsCount,
    ),
    completedCount: numberValue(
      recordValue(record, "completedCount", "completed_count", "completedRequestsCount"),
      data.completedCount,
    ),
    incompletedCount: numberValue(
      recordValue(record, "incompletedCount", "incompleted_count", "incompleteCount"),
      data.incompletedCount,
    ),
    pulltocenterCount: numberValue(
      recordValue(record, "pulltocenterCount", "pulltocenter_count", "pullToCenterCount", "pull_to_center_count"),
      data.pulltocenterCount,
    ),
    repeatedCount: numberValue(
      recordValue(record, "repeatedCount", "repeated_count"),
      data.repeatedCount,
    ),
    postponedCount: numberValue(
      recordValue(record, "postponedCount", "postponed_count"),
      data.postponedCount,
    ),
    notrepairableCount: numberValue(
      recordValue(record, "notrepairableCount", "notrepairable_count", "notRepairableCount", "not_repairable_count"),
      data.notrepairableCount,
    ),
    externalInvoicesCount: numberValue(
      recordValue(record, "externalInvoicesCount", "external_invoices_count"),
      data.externalInvoicesCount,
    ),
    internalInvoicesCount: numberValue(
      recordValue(record, "internalInvoicesCount", "internal_invoices_count"),
      data.internalInvoicesCount,
    ),
    newCustomersToday: numberValue(
      recordValue(record, "newCustomersToday", "new_customers_today", "newCustomersCount"),
      data.newCustomersToday,
    ),
    totalRevenuesSyp: numberValue(
      recordValue(record, "totalRevenuesSyp", "totalRevenueSyp", "total_revenues_syp", "total_revenue_syp", "totalRevenuesSYP"),
      data.totalRevenuesSyp,
    ),
    salesSyp: numberValue(
      recordValue(record, "salesSyp", "sales_syp", "salesSYP"),
      data.salesSyp,
    ),
    netProfitTodaySyp: numberValue(
      recordValue(record, "netProfitTodaySyp", "netProfitSyp", "net_profit_today_syp", "net_profit_syp"),
      data.netProfitTodaySyp,
    ),
    lastRequests: lastRequests.map(normalizeDashboardLastRequest),
  };
}

function normalizeDashboardTechnician(
  payload: unknown,
): DashboardTechnicianPerformanceItem {
  const parsed = DashboardTechnicianSchema.safeParse(payload);
  const technician = parsed.success ? parsed.data : DashboardTechnicianSchema.parse({});
  const record = isRecord(technician) ? technician : {};

  return {
    technicianId: stringValue(
      recordValue(record, "technicianId", "technician_id", "id", "_id", "userId", "user_id"),
      technician.technicianId,
    ),
    technicianName: stringValue(
      recordValue(record, "technicianName", "technician_name", "name", "fullName", "full_name"),
      technician.technicianName,
    ),
    userNumber: stringValue(
      recordValue(record, "userNumber", "user_number", "usernumber"),
      technician.userNumber,
    ),
    completedCount: numberValue(
      recordValue(record, "completedCount", "completed_count"),
      technician.completedCount,
    ),
    incompletedCount: numberValue(
      recordValue(record, "incompletedCount", "incompleted_count", "incompleteCount"),
      technician.incompletedCount,
    ),
    activeCount: numberValue(
      recordValue(record, "activeCount", "active_count"),
      technician.activeCount,
    ),
    pulltocenterCount: numberValue(
      recordValue(record, "pulltocenterCount", "pulltocenter_count", "pullToCenterCount", "pull_to_center_count"),
      technician.pulltocenterCount,
    ),
    timeline: technician.timeline,
    paymentsSyp: numberValue(
      recordValue(record, "paymentsSyp", "payments_syp", "paymentsSYP"),
      technician.paymentsSyp,
    ),
    paymentsUsd: numberValue(
      recordValue(record, "paymentsUsd", "payments_usd", "paymentsUSD"),
      technician.paymentsUsd,
    ),
    sales: numberValue(recordValue(record, "sales"), technician.sales),
  };
}

export function normalizeDashboardTechnicianPerformanceResponse(
  payload: unknown,
): DashboardTechnicianPerformance {
  assertSuccessfulResponse(payload, "تعذر جلب أداء الفنيين.");

  const response = DashboardTechnicianPerformanceResponseSchema.safeParse(payload);
  if (!response.success) {
    throw new ApiError("استجابة أداء الفنيين غير مطابقة للنموذج المتوقع.");
  }

  const parsed = DashboardTechnicianPerformanceDataSchema.safeParse(
    response.data.data ?? responseData(payload),
  );
  if (!parsed.success) {
    throw new ApiError("لم يرسل الخادم بيانات أداء الفنيين.");
  }

  const data = parsed.data;
  const record = data as unknown as JsonRecord;
  const overall = isRecord(recordValue(record, "overall", "summary"))
    ? (recordValue(record, "overall", "summary") as JsonRecord)
    : (data.overall as unknown as JsonRecord);
  const technicians = arrayValue(
    recordValue(record, "technicians", "technicianPerformances", "technician_performances", "items"),
    data.technicians,
  );

  return {
    overall: {
      completedToday: numberValue(
        recordValue(overall, "completedToday", "completed_today"),
        data.overall.completedToday,
      ),
      incompletedToday: numberValue(
        recordValue(overall, "incompletedToday", "incompleted_today", "incompleteToday"),
        data.overall.incompletedToday,
      ),
      pulltocenterToday: numberValue(
        recordValue(overall, "pulltocenterToday", "pulltocenter_today", "pullToCenterToday", "pull_to_center_today"),
        data.overall.pulltocenterToday,
      ),
      activeToday: numberValue(
        recordValue(overall, "activeToday", "active_today"),
        data.overall.activeToday,
      ),
      paymentsSypToday: numberValue(
        recordValue(overall, "paymentsSypToday", "payments_syp_today", "paymentsSYPToday"),
        data.overall.paymentsSypToday,
      ),
      paymentsUsdToday: numberValue(
        recordValue(overall, "paymentsUsdToday", "payments_usd_today", "paymentsUSDToday"),
        data.overall.paymentsUsdToday,
      ),
    },
    technicians: technicians.map(normalizeDashboardTechnician),
  };
}
