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
