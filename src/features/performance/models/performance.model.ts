import type {
  DashboardTechnicianPerformance,
  DashboardTechnicianPerformanceItem,
  DashboardTechnicianTimelineItem,
} from "@/models/dashboard/dashboard.model";

export type PerformanceOrderStatus =
  | "completed"
  | "incomplete"
  | "returned"
  | "active";

export interface OrderRevenue {
  syp: number;
  usd: number;
}

export interface TechnicianOrderPerformance {
  id: string;
  status: PerformanceOrderStatus;
  maintenanceHours: number;
  completionHours: number | null;
  startTime: string;
  endTime: string | null;
  revenue: OrderRevenue;
}

export interface TechnicianDailyPerformance {
  id: string;
  name: string;
  orders: readonly TechnicianOrderPerformance[];
  summary?: TechnicianPerformanceSummary;
}

export interface PerformanceSummary {
  completedOrders: number;
  incompleteOrders: number;
  returnedOrders: number;
  activeOrders: number;
  revenueSyp: number;
  revenueUsd: number;
}

export interface TechnicianPerformanceSummary extends PerformanceSummary {
  totalOrders: number;
}

type TimelineRecord = DashboardTechnicianTimelineItem & Record<string, unknown>;

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const normalized =
      typeof value === "string" ? value.replace(/,/g, "").trim() : value;
    const number = typeof normalized === "number" ? normalized : Number(normalized);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function nullableString(...values: unknown[]) {
  const value = stringValue(...values);
  return value || null;
}

function normalizePerformanceStatus(value: unknown): PerformanceOrderStatus {
  const status = stringValue(value).toLowerCase();
  if (status === "completed" || status === "done" || status === "complete") {
    return "completed";
  }
  if (
    status === "incomplete" ||
    status === "incompleted" ||
    status === "not_completed" ||
    status === "notcompleted"
  ) {
    return "incomplete";
  }
  if (
    status === "returned" ||
    status === "pulltocenter" ||
    status === "pull_to_center" ||
    status === "pulled_to_center"
  ) {
    return "returned";
  }
  return "active";
}

function timelineOrder(
  item: DashboardTechnicianTimelineItem,
  index: number,
): TechnicianOrderPerformance {
  const record = item as TimelineRecord;
  const status = normalizePerformanceStatus(
    record.status ?? record.requestStatus ?? record.request_status,
  );

  return {
    id: stringValue(
      record.requestNumber,
      record.request_number,
      record.orderNumber,
      record.order_number,
      record.id,
      record.requestId,
      record.request_id,
      record.label,
      index + 1,
    ),
    status,
    maintenanceHours: numberValue(
      record.maintenanceHours,
      record.maintenance_hours,
      record.repairHours,
      record.repair_hours,
      record.durationHours,
      record.duration_hours,
      record.value,
    ),
    completionHours:
      status === "active"
        ? null
        : numberValue(
            record.completionHours,
            record.completion_hours,
            record.completedHours,
            record.completed_hours,
            record.durationHours,
            record.duration_hours,
            record.value,
          ),
    startTime: stringValue(
      record.startTime,
      record.start_time,
      record.startedAt,
      record.started_at,
      record.createdAt,
      record.created_at,
      "—",
    ),
    endTime:
      status === "active"
        ? null
        : nullableString(
            record.endTime,
            record.end_time,
            record.completedAt,
            record.completed_at,
            record.finishedAt,
            record.finished_at,
          ),
    revenue: {
      syp: numberValue(
        record.revenueSyp,
        record.revenue_syp,
        record.paymentsSyp,
        record.payments_syp,
        record.amountSyp,
        record.amount_syp,
      ),
      usd: numberValue(
        record.revenueUsd,
        record.revenue_usd,
        record.paymentsUsd,
        record.payments_usd,
        record.amountUsd,
        record.amount_usd,
      ),
    },
  };
}

function technicianFromDashboard(
  technician: DashboardTechnicianPerformanceItem,
): TechnicianDailyPerformance {
  const totalOrders =
    technician.completedCount +
    technician.incompletedCount +
    technician.activeCount +
    technician.pulltocenterCount;

  return {
    id: technician.userNumber || technician.technicianId,
    name: technician.technicianName || "فني غير محدد",
    orders: technician.timeline.map(timelineOrder),
    summary: {
      totalOrders,
      completedOrders: technician.completedCount,
      incompleteOrders: technician.incompletedCount,
      returnedOrders: technician.pulltocenterCount,
      activeOrders: technician.activeCount,
      revenueSyp: technician.paymentsSyp || technician.sales,
      revenueUsd: technician.paymentsUsd,
    },
  };
}

export function performanceSummaryFromDashboard(
  performance: DashboardTechnicianPerformance | undefined,
): PerformanceSummary {
  const overall = performance?.overall;

  return {
    completedOrders: overall?.completedToday ?? 0,
    incompleteOrders: overall?.incompletedToday ?? 0,
    returnedOrders: overall?.pulltocenterToday ?? 0,
    activeOrders: overall?.activeToday ?? 0,
    revenueSyp: overall?.paymentsSypToday ?? 0,
    revenueUsd: overall?.paymentsUsdToday ?? 0,
  };
}

export function techniciansFromDashboardPerformance(
  performance: DashboardTechnicianPerformance | undefined,
): TechnicianDailyPerformance[] {
  return performance?.technicians.map(technicianFromDashboard) ?? [];
}

export function summarizeOrders(
  orders: readonly TechnicianOrderPerformance[],
): TechnicianPerformanceSummary {
  return orders.reduce<TechnicianPerformanceSummary>(
    (summary, order) => {
      summary.totalOrders += 1;
      summary.revenueSyp += order.revenue.syp;
      summary.revenueUsd += order.revenue.usd;

      if (order.status === "completed") summary.completedOrders += 1;
      if (order.status === "incomplete") summary.incompleteOrders += 1;
      if (order.status === "returned") summary.returnedOrders += 1;
      if (order.status === "active") summary.activeOrders += 1;

      return summary;
    },
    {
      totalOrders: 0,
      completedOrders: 0,
      incompleteOrders: 0,
      returnedOrders: 0,
      activeOrders: 0,
      revenueSyp: 0,
      revenueUsd: 0,
    },
  );
}

export function summarizeTechnicians(
  technicians: readonly TechnicianDailyPerformance[],
): PerformanceSummary {
  return technicians.reduce<PerformanceSummary>(
    (summary, technician) => {
      const technicianSummary = summarizeOrders(technician.orders);

      summary.completedOrders += technicianSummary.completedOrders;
      summary.incompleteOrders += technicianSummary.incompleteOrders;
      summary.returnedOrders += technicianSummary.returnedOrders;
      summary.activeOrders += technicianSummary.activeOrders;
      summary.revenueSyp += technicianSummary.revenueSyp;
      summary.revenueUsd += technicianSummary.revenueUsd;

      return summary;
    },
    {
      completedOrders: 0,
      incompleteOrders: 0,
      returnedOrders: 0,
      activeOrders: 0,
      revenueSyp: 0,
      revenueUsd: 0,
    },
  );
}
